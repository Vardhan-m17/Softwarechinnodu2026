function escapeRegex(value: string) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
function valueAfter(text: string, labels: string[]) {
  const pattern = labels.map(escapeRegex).join('|');
  const line = text.split(/\r?\n/).find(item => new RegExp(`(?:^|[^a-z])(?:${pattern})\\s*[:：-]`, 'i').test(item));
  return line?.match(new RegExp(`(?:^|[^a-z])(?:${pattern})\\s*[:：-]\\s*(.+)$`, 'i'))?.[1]?.trim() || '';
}
export function parseJobCaption(caption: string) {
  const lines = caption.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const headline = (lines[0] || '').replace(/[^\p{L}\d|@.,&()'’/\- ]/gu, ' ').replace(/\s+/g, ' ').trim();
  const labeledTitle = valueAfter(caption, ['position', 'job title', 'role', 'designation']);
  const hiring = headline.match(/^(.+?)\s+is\s+hiring(?:\s+for\s+(.+?))?(?:\s+in\s+(.+?))?[.!]?$/i);
  const hiringDash = headline.match(/^(.+?)\s+(?:is\s+)?hiring\s*[–—-]\s*(.+?)(?:\s*[|,]\s*(.+))?$/i);
  const hiringSentence = headline.match(/^.*?([\p{L}][\p{L} .&'-]+?)\s+is\s+hiring\s+for\s+(.+?)\s+in\s+(.+?)[.!]?$/iu);
  const pipeFormat = headline.match(/^(.+?)\s*[|]\s*(.+?)\s*[|]\s*(.+)$/i);
  const company = valueAfter(caption, ['company', 'employer', 'organization']) || hiringSentence?.[1]?.trim() || hiring?.[1]?.split(/!\s*/).pop()?.trim() || hiringDash?.[1]?.trim() || pipeFormat?.[2]?.trim() || '';
  const inferredTitle = hiringSentence?.[2]?.trim() || hiring?.[2]?.trim() || hiringDash?.[2]?.trim() || (pipeFormat ? pipeFormat[1].trim() : '');
  const inferredLocation = hiringSentence?.[3]?.trim() || hiring?.[3]?.trim() || hiringDash?.[3]?.trim() || (pipeFormat ? pipeFormat[3].trim() : '');
  const title = labeledTitle || inferredTitle || ((hiring || hiringDash || hiringSentence) ? 'Job opportunity' : lines.find(line => !/^(?:[^\p{L}\d]*)(company|position|job|location|posted|work mode|shift|category|salary|stipend|role overview|key responsibilities|qualifications|skills|apply)\b/iu.test(line)) || 'Job opportunity');
  const location = valueAfter(caption, ['location', 'place']) || inferredLocation;
  const salary = valueAfter(caption, ['salary', 'stipend', 'ctc', 'pay', 'package']);
  const jobId = valueAfter(caption, ['job id', 'job code', 'reference id', 'id']);
  const workMode = valueAfter(caption, ['work mode', 'work type', 'mode']);
  const shift = valueAfter(caption, ['shift']);
  const category = valueAfter(caption, ['category', 'domain']);
  const applyUrl = (caption.match(/https?:\/\/[^\s)]+/i) || [])[0] || '';
  const description = [valueAfter(caption, ['role overview', 'overview']), workMode && `Work mode: ${workMode}`, shift && `Shift: ${shift}`, category && `Category: ${category}`, jobId && `Job ID: ${jobId}`].filter(Boolean).join('\n');
  const skills = lines.filter(line => /^(?:[^\p{L}\d]*)(skills?|technologies|tools?)\s*:/iu.test(line)).flatMap(line => line.replace(/^[^:]+:\s*/, '').split(/[,|•]/)).map(item => item.trim()).filter(Boolean);
  return { title: title.replace(/^[^\p{L}\d]+/u, '').replace(/\s+/g, ' ').trim(), company, location, salary, jobId, workMode, shift, category, description: description || caption, skills, external_url: applyUrl };
}
