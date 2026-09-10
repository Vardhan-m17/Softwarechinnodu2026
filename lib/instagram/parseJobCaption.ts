function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function valueAfter(text: string, labels: string[]) {
  const pattern = labels.map(escapeRegex).join('|');
  const line = text.split(/\r?\n/).find(item => new RegExp(`(?:^|[^a-z])(?:${pattern})\\s*[:：-]`, 'i').test(item));
  return line?.match(new RegExp(`(?:^|[^a-z])(?:${pattern})\\s*[:：-]\\s*(.+)$`, 'i'))?.[1]?.trim() || '';
}
function cleanCompany(value: string) {
  return value.replace(/^[\W_]*(?:hi\s+everyone|hello\s+everyone|hey\s+everyone)\s*/i, '').replace(/\s+(?:is\s+)?hiring.*$/i, '').replace(/\s+/g, ' ').trim();
}
function explicitRole(lines: string[]) {
  return lines.map(line => line.replace(/[🚨🔥💳🤖💻✨🎓🎉💼]/gu, ' ').replace(/\s+/g, ' ').trim()).find(line => /\b(?:engineer|developer|analyst|associate|specialist|support|intern|manager|scientist|trainee|ambassador|representative|executive|advisor|designer|tester|architect|consultant)\b/i.test(line) && !/^(?:company|location|salary|posted|category|skills?|qualifications?|responsibilities|apply)\b/i.test(line));
}
function companyFromText(text: string) {
  const known = ['American Express','IG Group','Wells Fargo','Amazon','Ditto','Realme','Zoho Corporation','Zoho','Novo Nordisk','Novo','Genpact','IFF (International Flavors & Fragrances)','IFF','JPMorganChase','Hyland','Legrand','AXA XL','CSC','Barclays','Livspace','Scaler AI Labs','Virtusa','Paytm','Vodafone VOIS','Honeywell','Revature','Borderless','GlobalLogic','NTT DATA','HCLTech','Accenture','Standard Chartered','mthree','UST','L&T Energy Offshore','Merkle (Dentsu)','Tech Mahindra','Cognizant','Capgemini','Amgen','Kroll','Sophos'];
  return known.sort((a,b)=>b.length-a.length).find(name => new RegExp(`\\b${escapeRegex(name)}\\b`, 'i').test(text)) || '';
}
export function parseJobCaption(caption: string) {
  const lines = caption.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const headline = (lines[0] || '').replace(/[^\p{L}\d|@.,&()'’/\- ]/gu, ' ').replace(/\s+/g, ' ').trim();
  const labeledTitle = valueAfter(caption, ['position', 'job title', 'role', 'designation', 'job opening', 'vacancy', 'opening']);
  const hiring = headline.match(/^(.+?)\s+is\s+hiring(?:\s+for\s+(.+?))?(?:\s+in\s+(.+?))?[.!]?$/i);
  const hiringDash = headline.match(/^(.+?)\s+(?:is\s+)?hiring\s*[–—-]\s*(.+?)(?:\s*[|,]\s*(.+))?$/i);
  const hiringSentence = headline.match(/^.*?([\p{L}][\p{L} .&'-]+?)\s+is\s+hiring\s+for\s+(.+?)\s+in\s+(.+?)[.!]?$/iu);
  const pipeFormat = headline.match(/^(.+?)\s*[|]\s*(.+?)\s*[|]\s*(.+)$/i);
  const company = cleanCompany(valueAfter(caption, ['company', 'employer', 'organization', 'hiring company']) || companyFromText(caption) || hiringSentence?.[1]?.trim() || hiring?.[1]?.split(/!\s*/).pop()?.trim() || hiringDash?.[1]?.trim() || pipeFormat?.[2]?.trim() || '');
  const inferredTitle = hiringSentence?.[2]?.trim() || hiring?.[2]?.trim() || hiringDash?.[2]?.trim() || (pipeFormat ? pipeFormat[1].trim() : '');
  const inferredLocation = hiringSentence?.[3]?.trim() || hiring?.[3]?.trim() || hiringDash?.[3]?.trim() || (pipeFormat ? pipeFormat[3].trim() : '');
  const promotional = /^(?:mega\s+walk[ -]?in|job opportunity|hiring alert|launch your tech career|realme campus ambassador|.*\bis hiring\b|.*\bhiring\s*[-–—])/i.test(headline);
  const rawTitle = labeledTitle || inferredTitle || (promotional ? explicitRole(lines.slice(1)) || 'Job opportunity' : lines.find(line => !/^(?:[^\p{L}\d]*)(company|position|job|location|posted|work mode|shift|category|salary|stipend|role overview|key responsibilities|qualifications|skills|apply)\b/iu.test(line)) || 'Job opportunity');
  const title = rawTitle.replace(/^[^\p{L}\d]+/u, '').replace(/^(?:a|an|the)\s+/i, '').replace(/^(?:hiring alert\s*\|\s*|launch your tech career with\s+|job opportunity\s*[—-]\s*)/i, '').replace(/\s+(?:is\s+)?hiring(?:\s+\d{4})?\s*!?$/i, '').replace(/\s+freshers?\s+hiring(?:\s+\d{4})?\s*!?$/i, '').replace(/\s+/g, ' ').trim() || 'Job opportunity';
  const location = valueAfter(caption, ['location', 'place', '勤務地', 'based in', 'job location']) || inferredLocation;
  const salary = valueAfter(caption, ['salary', 'stipend', 'ctc', 'pay', 'package']);
  const jobId = valueAfter(caption, ['job id', 'job code', 'reference id', 'id']);
  const shift = valueAfter(caption, ['shift']);
  const category = valueAfter(caption, ['category', 'domain']);
  const workMode = /walk[ -]?in(?: drive)?/i.test(caption) ? 'Walk-in' : /\bhybrid\b/i.test(caption) ? 'Hybrid' : /\b(?:remote|wfh|work from home)\b/i.test(caption) ? 'Remote' : /\b(?:on[ -]?site|work from office|onsite)\b/i.test(caption) ? 'On-site' : 'Unspecified';
  const applyUrl = (caption.match(/https?:\/\/[^\s)]+/i) || [])[0] || '';
  const description = [valueAfter(caption, ['role overview', 'overview', 'job description', 'about the role']), workMode !== 'Unspecified' && `Work mode: ${workMode}`, shift && `Shift: ${shift}`, category && `Category: ${category}`, jobId && `Job ID: ${jobId}`].filter(Boolean).join('\n');
  const skills = lines.filter(line => /^(?:[^\p{L}\d]*)(skills?|technologies|tools?)\s*:/iu.test(line)).flatMap(line => line.replace(/^[^:]+:\s*/, '').split(/[,|•]/)).map(item => item.trim()).filter(Boolean);
  return { title, role: title, job_title: title, company: company || null, location: location || null, salary, jobId, job_id: jobId || null, workMode, work_mode: workMode, shift, category, description: description || caption, raw_cleaned_notes: null, skills, external_url: applyUrl };
}
