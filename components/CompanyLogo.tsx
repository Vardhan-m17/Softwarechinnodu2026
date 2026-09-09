import Image from 'next/image';

const logos: Record<string, string> = {
  amazon: '/company-amazon.svg',
  'amazon india': '/company-amazon.svg',
  wipro: '/company-wipro.svg',
  accenture: '/company-accenture.svg',
  cognizant: '/company-cognizant.svg',
  tcs: '/company-tcs.svg',
  infosys: '/company-infosys.svg',
  zoho: '/company-zoho.svg',
  capgemini: '/company-capgemini.svg',
};

export function CompanyLogo({ name, className = '' }: { name: string; className?: string }) {
  const key = name.trim().toLowerCase();
  const source = logos[key] ?? logos[Object.keys(logos).find((item) => key.includes(item)) ?? ''];
  return source ? <Image src={source} width={32} height={32} alt={`${name} logo`} className={className} /> : <span className={className}>{name.trim().charAt(0).toUpperCase()}</span>;
}
