"""Opt-in public outfits; a signed, HttpOnly cookie owns each saved companion."""
from django.core.exceptions import ValidationError
from django.conf import settings
from django.core.cache import cache
from django.http import JsonResponse
from django.utils.crypto import salted_hmac
from django.views.decorators.http import require_http_methods
from django.views.decorators.cache import never_cache
from .models import NoriProfile

OUTFITS = ('lavender', 'mint', 'sunset', 'midnight')
ACCESSORIES = ('none', 'glasses', 'cat', 'crown', 'star')
COOKIE = 'nori_companion'
SALT = 'portfolio.nori.owner.v1'


def own_profile(request):
    token = request.get_signed_cookie(COOKIE, default='', salt=SALT, max_age=365 * 86400)
    if not token:
        return None
    try:
        return NoriProfile.objects.filter(pk=token).first()
    except (ValueError, ValidationError):
        return None



def profile_data(profile):
    if not profile:
        return None
    return {'nickname': profile.nickname, 'outfit': profile.outfit,
            'accessory': profile.accessory, 'public': profile.public,
            'hidden': profile.hidden}


@never_cache
@require_http_methods(['GET', 'POST'])
def companion(request):
    from .views import _payload
    owner = own_profile(request)
    if request.method == 'GET':
        try:
            offset = max(0, min(10000, int(request.GET.get('offset', 0))))
        except ValueError:
            return JsonResponse({'error': 'Invalid gallery page.'}, status=400)
        public = NoriProfile.objects.filter(public=True, hidden=False).order_by('-created_at', '-pk')
        total = public.count()
        return JsonResponse({'mine': profile_data(owner), 'count': total,
                             'creations': [profile_data(p) for p in public[offset:offset + 12]],
                             'next': offset + 12 if offset + 12 < total else None})
    try:
        data = _payload(request)
        if data.get('action') == 'delete':
            if owner:
                owner.delete()
            response = JsonResponse({'deleted': True})
            response.delete_cookie(COOKIE, samesite='Lax')
            return response
        nickname = data.get('nickname', '')
        if not isinstance(nickname, str) or not 1 <= len(nickname.strip()) <= 24:
            raise ValueError()
        nickname = nickname.strip()
        # Names are plain display labels, not HTML, links, verified identities or accounts.
        if not all(c.isalnum() or c in " -_'" for c in nickname):
            raise ValueError()
        outfit, accessory = data.get('outfit'), data.get('accessory')
        if outfit not in OUTFITS or accessory not in ACCESSORIES or type(data.get('public')) is not bool:
            raise ValueError()
    except (ValueError, TypeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Use a name of 1–24 letters/numbers and choose an available outfit.'}, status=400)
    # Limit writes without storing raw addresses or personal browsing history.
    key = 'nori-save:' + salted_hmac('nori-save', request.META.get('REMOTE_ADDR', '')).hexdigest()
    cache.add(key, 0, 60)
    try:
        count = cache.incr(key)
    except ValueError:
        cache.set(key, 1, 60)
        count = 1
    if count > 8:
        return JsonResponse({'error': 'Give the sewing machine a minute, then try again.'}, status=429)
    if owner is None:
        daily_key = key + ':new'
        cache.add(daily_key, 0, 86400)
        try:
            creations = cache.incr(daily_key)
        except ValueError:
            cache.set(daily_key, 1, 86400)
            creations = 1
        if creations > 3:
            return JsonResponse({'error': 'Too many new companions today. Please come back tomorrow.'}, status=429)
        owner = NoriProfile()
    owner.nickname, owner.outfit, owner.accessory = nickname, outfit, accessory
    owner.public = data['public']
    owner.save()
    response = JsonResponse({'mine': profile_data(owner)})
    response.set_signed_cookie(COOKIE, str(owner.pk), salt=SALT, max_age=365 * 86400,
                               secure=settings.SESSION_COOKIE_SECURE, httponly=True, samesite='Lax')
    return response
