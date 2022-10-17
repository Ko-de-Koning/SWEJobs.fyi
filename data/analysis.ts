const languages = [
  'Bash',
  'C',
  'C++',
  'C#',
  'Cython',
  'ECMAScript',
  'Elixir',
  'Erlang',
  'F#',
  'Fortran',
  'Go',
  'Golang',
  'Java',
  'JavaScript',
  'Kotlin',
  'Lua',
  'MATLAB',
  ['Objective-C', 'Objective C'],
  'OpenCL',
  'Perl',
  'PHP',
  'PowerShell',
  'Python',
  'R',
  'Ruby',
  'Rust',
  'Scala',
  'Swift',
  'Tcl',
  'TypeScript',
  'Unity',
  'Unix shell',
  'Vala',
  'VBA',
  'VBScript',
  'Visual Basic',
]

const frontendStack = [
  ['Angular', 'AngularJS', 'Angular.js'],
  ['CSS', 'CSS3'],
  ['ExpressJS', 'Express.js', 'Express'],
  ['HTML', 'HTML5'],
  ['NextJS', 'Next.js'],
  ['React', 'ReactJS', 'React.js'],
  'Redux',
  'Remix',
  ['Svelte', 'SvelteJS', 'Svelte.js'],
  ['Vue', 'VueJS', 'Vue.js'],
]

const backendStack = [
  'Apache',
  'Aerospike',
  'Cassandra',
  'CockroachDB',
  'Couchbase',
  'DataStax',
  'Django',
  'Elasticsearch',
  ['ExpressJS', 'Express.js', 'Express'],
  'FastAPI',
  'Firebase',
  'Flask',
  'GraphQL',
  ['IBM Db2', 'Db2'],
  'Kafka',
  'MariaDB',
  'Memcached',
  ['MSSQL', 'Microsoft SQL'],
  ['MongoDB', 'Mongo'],
  'MySQL',
  'Neo4j',
  ['NodeJS', 'Node.js', 'Node'],
  'Oracle',
  ['PostgreSQL', 'Postgres'],
  'Redis',
  'Supabase',
  'SQL',
  'Vitess',
]

const devOpsStack = [
  'Ansible',
  'AWS',
  'Azure',
  'BigTable',
  'BigQuery',
  'DataFlow',
  'Groovy',
  'Jenkins',
  ['K8s', 'Kubernetes'],
  'RabbitMQ',
  ['GCP', 'Google Cloud Platform', 'Google Cloud'],
]

const dataMLStack = ['Dask', 'Presto', 'Hadoop', 'PyTorch', 'Spark', 'TensorFlow']

const checkIfSkillInDescription = (skill: string | string[], description: string): boolean => {
  // recursively check all the aliases if skill is an array of alias names
  if (skill instanceof Array) {
    const aliasExistArr = skill.map((skillAlias) =>
      checkIfSkillInDescription(skillAlias, description)
    )
    // return true if any of the aliases is in the description
    return aliasExistArr.some((aliasExist) => aliasExist === true)
  }
  // escape + character for regex on C++
  const skillRaw = skill.replaceAll('+', String.raw`\+`)
  const re = new RegExp(`([ /(]${skillRaw}[ /,):])`, 'gim')
  return re.test(description)
}

export const getSkillsInJobDescription = (description: string) => {
  const skills = []
  const allSkills = [
    ...languages,
    ...frontendStack,
    ...backendStack,
    ...devOpsStack,
    ...dataMLStack,
  ]
  allSkills.map((skill) => {
    if (checkIfSkillInDescription(skill, description)) {
      if (skill instanceof Array) skill = skill[0]
      skills.push(skill)
    }
  })

  return skills
}
