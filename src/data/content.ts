/**
 * Every fact rendered on this site lives here, and nowhere else.
 *
 * Components read from this file; they never hardcode a date, a number or a claim. That
 * makes the site auditable: to check whether something is true you read one file, not
 * fifteen components. Each block carries a `source` note saying where the fact came from
 * (resume, LinkedIn export, employment letter, Crossref) so nothing is folklore.
 */

export type Sourced = {
  /** Where this content was verified. Not rendered -- it exists so the file stays honest. */
  source: string
  /** Blocks carry their own shape; `source` is the only field they must all have. */
  [field: string]: unknown
}

/* ------------------------------------------------------------------ identity */

export const profile = {
  name: 'Anirudh Garg',
  /** Used for <title>, OG tags and the JSON-LD Person. */
  tagline: 'Compilers, static analysis, and markets.',
  location: 'Singapore',
  email: 'anirudhgarg.iitb@gmail.com',
  links: {
    linkedin: 'https://www.linkedin.com/in/anirudh-garg-675555254/',
    github: 'https://github.com/Action-Kamen',
    medium: 'https://medium.com/@anirudhgrg32',
    instagram: 'https://www.instagram.com/numberfivespeaks',
    scholar: null as string | null,
  },
  resume: '/doc/Anirudh-Garg-CV.pdf',
  source: 'resume/using_ai/June_2026.tex; LinkedIn_Profile_Aug_2026.pdf',
} satisfies Sourced

export const education = {
  degree: 'B.Tech. with Honours, Computer Science & Engineering',
  minor: 'Minor in Artificial Intelligence and Data Science',
  institution: 'Indian Institute of Technology Bombay',
  years: '2022 – 2026',
  cpi: '9.66 / 10',
  // Wording taken from the conferred degree certificate, which is the authoritative text:
  // "Bachelor of Technology with Honours in Computer Science and Engineering and with
  // Minor in Artificial Intelligence and Data Science", conferred 20 August 2026.
  source: 'B.Tech_Degree.pdf (conferred 20 Aug 2026); CPI from June_2026.tex',
} satisfies Sourced

/* --------------------------------------------------------------- publication */

export const publication = {
  title: 'IRIDIUM: A Framework for Statically Optimizing JavaScript Programs',
  venue: 'Proceedings of the ACM on Programming Languages',
  venueShort: 'PACMPL',
  volume: 'Vol. 10, OOPSLA1',
  published: '10 April 2026',
  doi: '10.1145/3798273',
  doiUrl: 'https://dl.acm.org/doi/10.1145/3798273',
  preprintUrl: 'https://www.cse.iitb.ac.in/~manas/docs/preprints/oopsla26.pdf',
  /**
   * `name` stays exactly as the published record has it, so this block can still be checked
   * against Crossref character for character. `title` is display only.
   */
  authors: [
    { name: 'Meetesh Kalpesh Mehta', affiliation: 'IIT Bombay', self: false },
    { name: 'Anirudh Garg', affiliation: 'IIT Bombay', self: true },
    { name: 'Aneeket Yadav', affiliation: 'IIT Delhi', self: false },
    { name: 'Manas Thakur', title: 'Prof.', affiliation: 'IIT Bombay', self: false },
  ],
  /** Verbatim from the published record. Do not paraphrase this. */
  abstract:
    'Static analysis of JavaScript remains notoriously difficult due to the language’s ' +
    'dynamically typed nature, unconventional scoping rules, and pervasive side effects. ' +
    'Unlike mature infrastructures such as LLVM for C/C++ or Soot for Java, comparable ' +
    'frameworks for JavaScript are fragmented and limited in scope. In this paper, we ' +
    'introduce IRIDIUM, a first-of-its-kind framework to statically optimize JavaScript ' +
    'programs. IRIDIUM systematically lowers JavaScript into a structured intermediate ' +
    'representation (called IRI) that models bindings, environments, and control flow ' +
    'explicitly. The resultant expressiveness enables more predictable analyses and ' +
    'transformations, ranging from dataflow tracking to optimization passes to executable ' +
    'code generation for existing runtimes, that are otherwise hindered by the language’s ' +
    'complexity. By bridging the gap between JavaScript’s surface syntax and the ' +
    'requirements of static analysis, IRIDIUM, thus, lays the foundation for a new ' +
    'generation of tools that can reason effectively about modern JavaScript applications.',
  source: 'Crossref 10.1145/3798273 (authors, venue, date, abstract verbatim)',
} satisfies Sourced

/* ---------------------------------------------------------------- experience */

export type Role = {
  org: string
  title: string
  where: string
  from: string
  to: string
  /** Sorts the timeline and drives the "incoming" treatment. ISO, first day. */
  start: string
  incoming?: boolean
  notes: string[]
  links?: { label: string; href: string }[]
}

export const experience: Role[] = [
  {
    org: 'Jump Trading',
    title: 'Quantitative Trader',
    where: 'Singapore',
    from: 'Sep 2026',
    to: '',
    start: '2026-09-14',
    incoming: true,
    notes: [],
  },
  {
    org: 'ETH Zürich',
    title: 'Scientific Assistant, Department of Computer Science (D-INFK)',
    where: 'Zürich, Switzerland',
    from: 'Jun 2026',
    to: 'Aug 2026',
    start: '2026-06-01',
    notes: [
      'Worked with Prof. Zhendong Su and Dr. Cong Li in the Advanced Software ' +
        'Technologies lab on Reify, a random program ' +
        'generator built on semantic reification — given a control-flow graph and an ' +
        'execution path through it, Reify constructs a program guaranteed to follow that ' +
        'path and produce a known output.',
      'Adapted the generator towards SV-COMP, the software verification competition: a ' +
        'generator that knows the answer by construction yields tasks whose expected ' +
        'verdict is correct by construction rather than by community consensus.',
      'Worked against LLVM as the substrate for generation and lowering.',
    ],
    links: [
      { label: 'RefractIR', href: 'https://github.com/Action-Kamen/RefractIR' },
      { label: 'ubfree_benchmarks', href: 'https://github.com/Action-Kamen/ubfree_benchmarks' },
    ],
  },
  {
    org: 'Via',
    title: 'Software Development Consultant',
    where: 'Mumbai, India',
    from: 'Apr 2026',
    to: 'May 2026',
    start: '2026-04-06',
    notes: [
      'Contributed across software development projects at an early-stage startup, on both ' +
        'technical implementation and product decisions.',
      'Worked directly with clients to draw out requirements and pitch solutions, and ran ' +
        'user interviews that fed into refining the ideal customer profile.',
    ],
  },
  {
    org: 'Jump Trading',
    title: 'Quantitative Trader Intern',
    where: 'Singapore',
    from: 'May 2025',
    to: 'Aug 2025',
    start: '2025-05-26',
    notes: [
      'Built pricing models for ETFs and equities using futures-based adjustments and ' +
        'cross-asset relationships, testing several model architectures and feature ' +
        'selection approaches against each other.',
      'Validated alpha signals and implemented a backtesting engine to turn them into ' +
        'tradeable strategies.',
      'Wrote Python tooling for hedge index selection and beta estimation, reconciled against ' +
        'Bloomberg’s own figures.',
    ],
  },
  {
    org: 'Franklin Templeton',
    title: 'Software Development & Data Science Intern',
    where: 'Hyderabad, India',
    from: 'May 2024',
    to: 'Jul 2024',
    start: '2024-05-01',
    notes: [
      'Automated extraction of data from the web, PDFs and workbooks in R, and the upload ' +
        'of that data into a Macrobond database.',
      'Extended an in-house R platform for investment strategies with automated ' +
        'notifications, secure login, data change tracking and analytical visualisations ' +
        'for real-time performance monitoring.',
    ],
  },
  {
    org: 'Jane Street',
    title: 'SEE Program',
    where: 'Hong Kong',
    from: 'Dec 2023',
    to: 'Dec 2023',
    start: '2023-12-01',
    notes: [
      'One of 50 students selected from India for the Hong Kong office programme — ' +
        'lectures, mock trading and research workshops on the firm’s quantitative approach.',
      'Built linear regression models to predict stock market indicators from market data.',
    ],
  },
]

/* ------------------------------------------------------------------ specimens */

/** A featured project. `figure` names the canvas/SVG diagram that draws its mechanism. */
export type Specimen = {
  id: string
  title: string
  kind: string
  year: string
  context: string
  /** One line that survives on its own in a list. */
  summary: string
  problem: string
  built: string[]
  tradeoff: string
  stack: string[]
  figure: 'lowering' | 'pointer' | 'tiling' | 'regime'
  links?: { label: string; href: string }[]
}

/**
 * The published work, given its own section.
 *
 * It used to be both the Research section and the first entry under Selected work, which
 * meant a reader met IRIDIUM twice and read the same claim in two voices. It lives here now
 * and nowhere else.
 */
export const flagship: Specimen = {
    id: 'iridium',
    title: 'IRIDIUM',
    kind: 'Research — published at OOPSLA 2026',
    year: 'Autumn 2025',
    context: 'with Meetesh Kalpesh Mehta, Aneeket Yadav and Prof. Manas Thakur',
    summary:
      'A framework that lowers JavaScript into an explicit IR so optimising it becomes safe rather than speculative.',
    problem:
      'C and C++ have LLVM. Java has Soot. JavaScript’s equivalents are fragmented and ' +
      'limited in scope — its dynamic typing, unconventional scoping and pervasive side ' +
      'effects mean most prior work aimed at applications that never needed soundness in ' +
      'the first place, and almost none of it optimises. The obstacle ' +
      'is that the things an optimiser must reason about — which binding a name resolves to, ' +
      'which environment it lives in, whether it is initialised yet — are invisible in the ' +
      'surface syntax.',
    built: [
      'Normalisation passes that lower JavaScript into IRI, an intermediate representation ' +
        'that makes bindings, environments and control flow explicit rather than implied.',
      'Temporal Dead Zone and alias analyses over that IR.',
      'Optimisations riding on those analyses: TDZ barrier removal, constant propagation ' +
        'and folding, dead code elimination and dead binding elimination.',
      'A code generation pass emitting executable code for QuickJS-NG — the runtime ' +
        'behind Amazon LLRT — so the optimised IR actually runs rather than sitting in a paper.',
    ],
    tradeoff:
      'Making the implicit explicit costs IR size and lowering time on every program, ' +
      'including the ones that would not have benefited. The trade buys analyses whose ' +
      'results are predictable instead of best-effort — which is the whole point, since an ' +
      'unsound optimisation of JavaScript is not a slow program but a wrong one.',
    stack: ['Static analysis', 'IR design', 'Dataflow', 'TDZ', 'QuickJS-NG'],
    figure: 'lowering',
    links: [
      { label: 'ACM DL · 10.1145/3798273', href: 'https://dl.acm.org/doi/10.1145/3798273' },
      { label: 'Preprint PDF', href: 'https://www.cse.iitb.ac.in/~manas/docs/preprints/oopsla26.pdf' },
      { label: 'SpiderMonkey benchmarking', href: 'https://github.com/Action-Kamen/Spider-Monkey-benchmarking' },
    ],
  }

export const specimens: Specimen[] = [
  {
    id: 'prakriti',
    title: 'prakriti',
    kind: 'B.Tech. thesis — sound JavaScript security analysis',
    year: 'Spring 2026',
    context: 'with Prof. Manas Thakur',
    summary:
      'Measured why JavaScript security scanners miss real bugs, then designed the analysis they were missing.',
    problem:
      'JavaScript security tooling reports plenty and catches little. The starting question ' +
      'was whether the dynamic constructs everyone blames — chiefly eval — are still as ' +
      'pervasive as the 2011 literature claimed, and if the scanners fail, whether they all ' +
      'fail for the same underlying reason or for many unrelated ones.',
    built: [
      'A replication of Richards et al.’s 2011 eval study across 10,000 Tranco sites, ' +
        'driven by Playwright and the Chrome DevTools Protocol: 89.2% of sites use eval, ' +
        '90.8% of calls are potentially risky, 25.5% carry DOM-tainted input.',
      'The IRIDIUM Security testbench — 42 JavaScript cases spanning prototype pollution, ' +
        'insecure prototype tampering and arbitrary file access — and a benchmark of ' +
        'ESLint, Semgrep and ODGen against it. None of the three carries points-to ' +
        'information strong enough to follow the aliasing these bugs depend on: ESLint has ' +
        'none by design, Semgrep’s taint tracking is intraprocedural, ODGen’s object graph ' +
        'is partial.',
      'Design work on prakriti, an ECMA-spec-grounded pointer analysis engine in C++17, ' +
        'with copy-on-write points-to sets — a fork is O(1), and only the sets a callee ' +
        'writes are ever duplicated — and a rolling-XOR graph hash that reduces the ' +
        'fixpoint test to comparing two words instead of two graphs.',
    ],
    tradeoff:
      'The rolling hash turns the fixpoint test into a word comparison rather than a graph ' +
      'comparison, but it is a hash: equal digests mean equal graphs only up to collision. ' +
      'Copy-on-write likewise trades aliasing discipline for clone cost — the right trade ' +
      'when an analysis forks state constantly and mutates little of it.',
    stack: ['C++17', 'Pointer analysis', 'Playwright', 'CDP', 'ECMA-262'],
    figure: 'pointer',
  },
  {
    id: 'flashattention',
    title: 'FlashAttention, from scratch',
    kind: 'High-performance ML systems',
    year: 'Spring 2026',
    context: 'with Prof. Mythili Vutukuru',
    summary:
      'A Transformer built up from custom CUDA kernels, with attention made memory-aware.',
    problem:
      'Attention is not compute-bound; it is memory-bound. A textbook implementation ' +
      'materialises the full N×N score matrix in HBM and reads it back twice, so the GPU ' +
      'spends its time waiting on bandwidth rather than doing arithmetic. The arithmetic was ' +
      'never the bottleneck.',
    built: [
      'Core deep learning components engineered from scratch in PyTorch and CUDA/C++.',
      'A Transformer architecture with an integrated FlashAttention kernel that tiles the ' +
        'computation across SRAM and HBM so scores are consumed inside fast memory instead ' +
        'of round-tripping through slow memory.',
      'Matrix multiplication using shared-memory tiling and vectorised memory access, and ' +
        'an MLP with custom forward and backward kernels.',
    ],
    tradeoff:
      'Tiling buys bandwidth by paying in arithmetic: values are recomputed rather than ' +
      'stored, and the tile size trades occupancy against how much of the working set fits ' +
      'in SRAM. On a memory-bound kernel that is a bargain, which is exactly why it is not ' +
      'the right move on a compute-bound one.',
    stack: ['CUDA', 'C++', 'PyTorch', 'GPU memory hierarchy'],
    figure: 'tiling',
  },
  {
    id: 'regimes',
    title: 'Crypto market regimes',
    kind: 'Quantitative research — InterIIT Tech Meet 13.0',
    year: 'Winter 2024',
    context: 'Quant team, IIT Bombay contingent',
    summary:
      'Regime classification for BTC and ETH from high-dimensional time-series features.',
    problem:
      'A model fitted across a whole price history implicitly assumes one market. Crypto is ' +
      'not one market; it moves between regimes, and the relationships that hold in one do ' +
      'not survive into the next. Detecting the switch matters more than fitting the mean.',
    built: [
      'Predictive models for BTC and ETH regime classification using elastic-net ' +
        'regularised regression and gradient-boosted trees across high-dimensional ' +
        'time-series features.',
      'Statistical analysis of price–volume dynamics, volatility clustering, seasonality ' +
        'and cross-asset lead–lag relationships across OHLCV data, used both to design ' +
        'regime-shift predictors and to validate what the models produced.',
    ],
    tradeoff:
      'Elastic net and gradient boosting pull in opposite directions on purpose. The first ' +
      'is stable and readable, but its decision boundary is a hyperplane through the ' +
      'features you hand it, so a switch has to be engineered in as a feature; the second ' +
      'finds its own splits, and will happily split on noise. Running both asks whether a ' +
      'detected shift survives a change of model class.',
    stack: ['Elastic net', 'Gradient boosting', 'Time series', 'OHLCV'],
    figure: 'regime',
  },
]

/** A research note: prose only, no diagram. Sits under the flagship in the same section. */
export type ResearchNote = {
  title: string
  year: string
  context: string
  blurb: string
  tags: string[]
  links?: { label: string; href: string }[]
}

export const researchNotes: ResearchNote[] = [
  {
    title: 'Reify, and generating verification tasks',
    year: 'Summer 2026',
    context: 'Prof. Zhendong Su and Dr. Cong Li · Advanced Software Technologies lab, ETH Zürich',
    blurb:
      'Reify generates random programs by semantic reification: given a control-flow graph ' +
      'and an execution path through it, it constructs a program guaranteed to follow that ' +
      'path and produce a known output. I worked on pointing that at SV-COMP, the software ' +
      'verification competition — a generator that knows the answer by construction yields ' +
      'tasks whose expected verdict is correct by construction rather than by community ' +
      'consensus. LLVM was the substrate for generation and lowering.',
    tags: ['LLVM', 'Program generation', 'SV-COMP', 'Verification'],
    links: [
      { label: 'RefractIR', href: 'https://github.com/Action-Kamen/RefractIR' },
      { label: 'ubfree_benchmarks', href: 'https://github.com/Action-Kamen/ubfree_benchmarks' },
    ],
  },
  {
    title: 'Approximate nearest neighbour search by group testing',
    year: 'Summer 2024',
    context: 'Prof. Ajit Rajwade · Amazon-funded',
    blurb:
      'Nearest-neighbour search normally scores candidates one at a time. Group testing ' +
      'scores them in batches: a recursive method evaluates and splits dictionary and ' +
      'query-vector groups on dot-product thresholds, so most candidates are eliminated a ' +
      'group at a time rather than individually. Tested with cumulative query batching of ' +
      '10,000 queries against a 60,000-vector, 784-dimensional dataset.',
    tags: ['Group testing', 'High-dimensional search', 'Python'],
  },
]

/* ---------------------------------------------------------------- other work */

export type Entry = {
  title: string
  year: string
  context: string
  blurb: string
  tags: string[]
  repo?: string
}

export const otherWork: Entry[] = [
  {
    title: 'Market simulator',
    year: 'Autumn 2023',
    context: 'Prof. Ashutosh Gupta',
    blurb:
      'A multi-trader market simulation in C++ using threads and sockets to take concurrent ' +
      'orders, running median-trading and statistical arbitrage strategies against the book. ' +
      'The matching engine sits on a custom ordered map backed by red-black trees with ' +
      'per-level priority queues, handled across worker threads with minimal locking.',
    tags: ['C++', 'Threads', 'Sockets', 'Red-black trees'],
    repo: 'https://github.com/Action-Kamen/Market-Simulator',
  },
  {
    title: 'Statistical learning and information retrieval',
    year: 'Spring 2026',
    context: 'Prof. Soumen Chakrabarti',
    blurb:
      'Pipelines across information retrieval, representation learning and graph-based ' +
      'semi-supervised learning. Neural rankers and MRF probabilistic rerankers, RNN and GRU ' +
      'architectures implemented from first principles, and a reimplementation of the ' +
      'Correct & Smooth graph diffusion algorithm with optimised sparse GPU operations.',
    tags: ['PyTorch', 'PyTorch Geometric', 'BERT', 'Graph learning'],
    repo: 'https://github.com/Action-Kamen/lwg-project',
  },
  {
    title: 'Network systems performance and traffic analysis',
    year: 'Autumn 2025',
    context: 'Prof. Devashish Gosain',
    blurb:
      'Virtualised testbeds in FreeBSD, Linux and Shadow to study routing, filtering, VPN ' +
      'protocols and anonymous communication. Custom packet-processing modules including a ' +
      'FreeBSD pf kernel firewall and a Wireshark dissector that fingerprints OpenVPN traffic ' +
      'independently of ports or addresses, plus benchmarking of Tor onion services under ' +
      'relay-failure stress.',
    tags: ['FreeBSD', 'Shadow', 'Tor', 'Wireshark'],
  },
  {
    title: 'Adaptive cache architecture',
    year: 'Autumn 2024',
    context: 'Prof. Biswabandan Panda',
    blurb:
      'A fixed 64-byte line fetches more than most accesses use — the literature puts L1 ' +
      'and LLC data under-utilisation between 17% and 80%. A dynamic-granularity cache ' +
      'with adaptive line sizing and spatial predictors cut the miss rate by 18% and gave ' +
      'up to 50% speedup on memory-bound SPEC CPU2006 workloads, with 46% less L1–L2 ' +
      'traffic. Synthesis and CACTI put the cost at roughly 1% area and 0.02–0.035 ns of ' +
      'added latency.',
    tags: ['Computer architecture', 'Cache design', 'SPEC CPU2006', 'CACTI'],
  },
  {
    title: 'Operating systems, from the inside',
    year: 'Spring 2024',
    context: 'Prof. Mythili Vutukuru',
    blurb:
      'xv6 extended with a weighted round-robin scheduler and a copy-on-write fork, and a ' +
      'filesystem rebuilt to survive being interrupted — crash-consistent reads and writes ' +
      'to data blocks. Also a client-server architecture over locks, threads and IPC, and ' +
      'custom semaphores in C on pthreads to synchronise access to shared memory.',
    tags: ['C', 'xv6', 'Schedulers', 'Crash consistency', 'pthreads'],
  },
  {
    title: 'Compressed sensing',
    year: 'Spring 2024',
    context: 'Prof. Ajit Rajwade',
    blurb:
      'Faster orthogonal matching pursuit using Cholesky and QR decompositions and the matrix ' +
      'inversion lemma, benchmarked on greyscale Caltech256, plus video reconstruction ' +
      'comparing ISTA and IHTA across frames on a 3-D DCT basis.',
    tags: ['OMP', 'ISTA', 'Signal processing', 'MATLAB'],
  },
  {
    title: 'Game-theoretic multilevel programming',
    year: 'Spring 2024',
    context: 'Profs. Sriram Sankaranarayanan, Avinash Bhardwaj and Swaprava Nath',
    blurb:
      'The watermelon algorithm applied to price-setting problems and Stackelberg games, and ' +
      'work at the intersection of the Multilevel Critical Node problem and Blotto games to ' +
      'model defender–attacker scenarios as bilevel and trilevel optimisation.',
    tags: ['Game theory', 'Bilevel optimisation', 'Stackelberg'],
    repo: 'https://github.com/Action-Kamen/Mixed-Integer-Multilevel-Programming',
  },
  {
    title: 'sMART optimisation',
    year: 'Autumn 2023',
    context: 'Prof. Avinash Bhardwaj',
    blurb:
      'The continuous facility location problem extended to placing outlets across a city, ' +
      'with Blossom and Hungarian algorithms for assignment and maximum bipartite matching. ' +
      'Also a linear formulation of a maximum-weight closed walk over a chosen subset of ' +
      'edges, used to find the longest such route on the IIT Bombay campus with Python MIP ' +
      'and the CBC solver.',
    tags: ['Python MIP', 'CBC', 'Combinatorial optimisation'],
    repo: 'https://github.com/Action-Kamen/sMART-Optimisation',
  },
]

/* ---------------------------------------------------------------- the rest */

export const achievements = [
  { figure: 'AIR 50', label: 'JEE Advanced', detail: 'of 150,000+ candidates', year: '2022' },
  { figure: '99.98', label: 'JEE Main percentile', detail: 'AIR 224, 1M+ candidates', year: '2022' },
  { figure: 'AIR 2', label: 'Vidyarthi Vigyan Manthan', detail: 'of 140,000+ students', year: '2018' },
  { figure: '×2', label: 'INMO qualifier', detail: 'Indian National Maths Olympiad', year: '2020, 2021' },
  { figure: '1st', label: 'AMC 10', detail: 'first place and Honor Roll', year: '2020' },
  { figure: 'NTSE', label: 'National Talent Search', detail: 'scholarship, NCERT', year: '2020' },
  { figure: 'Top 1%', label: 'IOQP Stage 1', detail: 'physics olympiad qualifier, IAPT', year: '2022' },
  { figure: 'Bronze', label: 'SEAMO', detail: 'SE Asian maths olympiad, intermediate', year: '2018' },
]

export const leadership = [
  {
    role: 'Contingent Leader, InterIIT Tech Meet 14.0',
    org: 'IIT Bombay',
    period: 'Sep 2025 – Aug 2026',
    note: 'Led the institute contingent, a team of 100.',
  },
  {
    role: 'Teaching Assistant',
    org: 'CSE, IIT Bombay',
    period: 'Jul 2024 – Nov 2025',
    note: 'Machine learning, optimisation models, logic and programming paradigms.',
  },
  {
    role: 'Media Secretary',
    org: 'Computer Science Engineering Association',
    period: 'Apr 2023 – Apr 2024',
    note: '',
  },
  {
    role: 'Student Mentor, DAMP',
    org: 'CSE Department',
    period: 'May 2024 – Apr 2025',
    note: 'Mentored 12 sophomores.',
  },
]

export const skills = [
  { group: 'Languages', items: ['C++', 'Python', 'R', 'SQL', 'Java', 'OCaml', 'JavaScript', 'Bash', 'LaTeX'] },
  { group: 'Systems', items: ['CUDA', 'LLVM', 'SpiderMonkey', 'QuickJS', 'FreeBSD', 'GDB', 'Slurm', 'Git'] },
  { group: 'Numerical', items: ['PyTorch', 'NumPy', 'Pandas', 'SciPy', 'TensorFlow', 'Matplotlib', 'MIP'] },
  { group: 'Markets', items: ['Bloomberg', 'Macrobond', 'MATLAB', 'Backtesting', 'Beta estimation'] },
]

export const human = {
  intro:
    'I cycle. I am learning to swim, which at twenty-two is a humbling way to spend a ' +
    'Tuesday. I play squash, badly enough to enjoy it and well enough to have won ' +
    'something once. I play the piano properly, and a harmonica that needs a lot of ' +
    'effort still.',
  reading:
    'I read a lot — markets and finance mostly, and whatever else has ended up on the ' +
    'pile. I spent a year leading the IIT Bombay contingent to InterIIT, which is a ' +
    'hundred people and rather less glamorous than it sounds.',
  writing:
    'I keep a page of musings at @numberfivespeaks — things I was thinking about, written ' +
    'down mostly so I would stop thinking about them.',
  source: 'stated by Anirudh, Sep 2026',
}
