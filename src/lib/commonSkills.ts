// Lista curada de tecnologias comunes para sugerir en el perfil. No depende
// de ninguna API externa a proposito: para este volumen de datos (unos
// cientos de strings), una lista estatica es mas simple, mas rapida y no
// tiene coste ni limite de peticiones.
export const COMMON_SKILLS = [
  // Lenguajes
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C#', 'C++', 'Go', 'Rust', 'PHP', 'Ruby', 'Kotlin', 'Swift',
  // Frontend
  'React', 'Angular', 'Vue', 'Svelte', 'Next.js', 'Vite', 'Redux', 'Tailwind CSS', 'Sass', 'HTML', 'CSS',
  // Backend
  'Node.js', 'Express', 'NestJS', 'Django', 'Flask', 'Spring Boot', '.NET', 'FastAPI',
  // Bases de datos
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'Prisma', 'Sequelize', 'TypeORM',
  // Cloud / DevOps
  'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'CI/CD', 'GitHub Actions', 'Terraform',
  // Testing
  'Jest', 'Vitest', 'Testing Library', 'Cypress', 'Playwright', 'Supertest',
  // IA / Datos
  'OpenAI API', 'Gemini API', 'LangChain', 'RAG', 'Prompt Engineering', 'Pandas', 'TensorFlow',
  // Herramientas y practicas
  'Git', 'GitHub', 'Agile', 'Scrum', 'REST API', 'GraphQL', 'WebSockets', 'Zod', 'JWT', 'OAuth',
] as const;