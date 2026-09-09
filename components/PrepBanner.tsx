import Link from 'next/link';

const tools = [
  { image: '/mic-illustration.png', title: 'Voice Talk Zone', description: 'Practice real-time interviews with AI voice coach and improve your communication.', button: 'Start Practice →', href: '/voice-talk-zone' },
  { image: '/resume-illustration.png', title: 'Resume Builder', description: 'Create ATS-friendly resumes that get you more interviews.', button: 'Build Resume →', href: '/resume-builder' },
  { image: '/mock-illustration.png', title: 'Mock Tests', description: 'Take role-specific mock tests and improve your skills.', button: 'Take Test →', href: '/mock-tests' },
];

export function PrepBanner() {
  return (
    <section className="prep">
      <h2><span className="prep-heading-mark" aria-hidden="true">✦</span>Power Up Your Preparation</h2>
      <p><span className="prep-subtitle-mark" aria-hidden="true">+</span>Strengthen your skills and get interview-ready with our most used tools.</p>
      <div className="prep-cards">
        {tools.map((tool) => (
          <article className="card feature tool-card" key={tool.title}>
            <img className="tool-card-image" src={tool.image} alt="" />
            <h3 className="tool-card-title">{tool.title}</h3>
            <p className="tool-card-description">{tool.description}</p>
            <Link className="button tool-card-button" href={tool.href}>{tool.button}</Link>
          </article>
        ))}
      </div>
    </section>
  );
}
