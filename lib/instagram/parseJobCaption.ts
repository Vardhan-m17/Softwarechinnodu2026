function valueAfter(text: string, labels: string[]) {
  const line = text.split(/\r?\n/).find(item => labels.some(label => item.toLowerCase().startsWith(label.toLowerCase())));
  return line ? line.replace(/^[^:：-]+[:：-]\s*/, '').trim() : '';
}

export function parseJobCaption(caption: string) {
  const lines = caption.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const title = valueAfter(caption, ['position', 'job title', 'role']) || lines.find(line => !/^(company|position|job|location|posted|work mode|shift|category|salary|stipend|role overview|key responsibilities|qualifications|skills|apply)/i.test(line)) || 'Job opportunity';
  const company = valueAfter(caption, ['company']) || '';
  const location = valueAfter(caption, ['location']) || '';
  const salary = valueAfter(caption, ['salary', 'stipend', 'ctc', 'pay']) || '';
  const jobId = valueAfter(caption, ['job id', 'job code', 'id']) || '';
  const workMode = valueAfter(caption, ['work mode', 'work type']) || '';
  const shift = valueAfter(caption, ['shift']) || '';
  const category = valueAfter(caption, ['category']) || '';
  const applyUrl = (caption.match(/https?:\/\/[^\s)]+/i) || [])[0] || '';
  const description = [valueAfter(caption, ['role overview', 'overview']), workMode && `Work mode: ${workMode}`, shift && `Shift: ${shift}`, category && `Category: ${category}`, jobId && `Job ID: ${jobId}`].filter(Boolean).join('\n');
  const skills = lines.filter(line => /^(skills?|technologies|tools?)\s*:/i.test(line)).flatMap(line => line.replace(/^[^:]+:\s*/, '').split(/[,|•]/)).map(item => item.trim()).filter(Boolean);
  return { title, company, location, salary, description: description || caption, skills, external_url: applyUrl };
}
