export const content = {
 name:'Abdulla Shahzan', location:'Abha, Saudi Arabia', roles:['Computer Engineering student','Cortical visual prosthetics researcher','IT engineer'], tagline:'[ONE LINE ABOUT THE WORK, IN TWELVE WORDS OR FEWER]',
 about:'[I study computer engineering and investigate cortical visual prosthetics. Add the specific question I am working on, the methods I use, and what I hope to understand. Describe how my infrastructure, networking and procurement work informs that research. Keep this statement grounded in work I can show.]',
 focus:['[Cortical visual prosthetics]','[Research focus phrase]','[Engineering focus phrase]'],
 research:Array.from({length:3},(_,i)=>({title:['[Research question and specific area of investigation]','[Methods for studying cortical visual prosthetics]','[Research direction and next question to investigate]'][i],summary:'[A one-line account of the question, approach and scope of this independent research.]',status:'[RESEARCH STATUS]',link:null})),
 projects:Array.from({length:4},(_,i)=>({title:['[Project title and its specific engineering focus]','[A system built to address a concrete problem]','[An investigation with a clearly defined scope]','[A tool, experiment or working implementation]'][i],year:'[YEAR]',tags:'[FIELD / METHOD]',summary:'[What this project does, your contribution, and the specific problem it addresses.]',link:null})),
 experience:{role:'IT Engineer',institution:'Saudicast',description:'Infrastructure, networking, procurement',dates:'[DATES]'},education:{institution:'King Khalid University',role:'Computer Engineering',description:'College of Computer Science',dates:'[YEARS]'},email:null,socials:[{label:'GitHub',url:null},{label:'LinkedIn',url:null},{label:'Scholar / ORCID',url:null}]
};

// Editorial additions. Replace a single entry here to add a supplied certificate.
content.defaultPersona = 'researcher';
content.switchHint = 'Same person. Different priorities.';
content.personas = {
 researcher: {label:'Researcher', tagline:'[A question about cortical vision, models and evidence]', roleLine:'[Independent researcher / Cortical visual prosthetics]', about:'[I investigate cortical visual prosthetics independently, without a lab or supervisor. Describe the question I am pursuing, the models I use and the evidence I examine. Explain what remains unsolved and how I evaluate an idea. Keep this account specific to work I can document.]', focus:['[Cortical visual prosthetics]','[Models and evidence]','[Unsolved questions]']},
 engineer: {label:'Engineer', tagline:'[Systems built, shipped and kept running]', roleLine:'[Computer engineering / IT infrastructure]', about:'[I study computer engineering and work on infrastructure, networking and procurement at Saudicast. Describe the systems I build, maintain and support, and my contribution to full-stack projects. Explain a concrete engineering responsibility and how I approach reliability. Keep this account specific to work I can document.]', focus:['[Infrastructure]','[Networking]','[Full-stack builds]']}
};
content.achievements = [
 {id:'huawei-regional',title:'Third Prize, Practice Competition, Cloud Track',event:'Huawei ICT Competition 2025-2026',level:'Middle East & Central Asia (regional)',year:'2025',date:'2025-12-25',desc:'Certificate dated 25 Dec 2025.',for:'engineer'},
 ...Array.from({length:3},(_,i)=>({id:`achievement-${i+2}`,title:`[Achievement ${i+2}: a specific result or recognition]`,event:'[EVENT]',level:'[LEVEL OR REGION]',year:'[YEAR]',desc:{researcher:'[Describe the evidence, research contribution and significance of this achievement.]',engineer:'[Describe the system, engineering contribution and significance of this achievement.]'},for:'both'}))
];
content.certificates = Array.from({length:29},(_,i)=>({id:`certificate-${i+1}`,title:`[Certificate ${String(i+1).padStart(2,'0')}: subject and qualification]`,issuer:'[ISSUER]',date:'[DATE]',credentialId:'[CREDENTIAL ID]',image:null,thumbnail:null,url:null,for:'both'}));
