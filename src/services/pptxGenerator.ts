import PptxGenJS from 'pptxgenjs';
import {
  Product,
  Order,
  User,
  CountryLocation,
  FinancialRecord,
  SystemActivity,
} from '../types';
import { isProductPermittedForCustomerCapacity } from '../utils/purchasePermissions';
import coverHarvestImg from '../assets/images/florentine_cover_harvest_1794990899384.jpg';
import deliveryHubImg from '../assets/images/florentine_delivery_hub_1794990899810.jpg';

export type SlideLayoutKind =
  | 'cover'
  | 'metrics-split'
  | 'photo-editorial'
  | 'table'
  | 'grid-pillars'
  | 'roadmap'
  | 'comparison-columns'
  | 'closing-qa';

export interface SlideMetric {
  label: string;
  value: string;
  detail: string;
}

export interface SlideHighlight {
  title: string;
  description: string;
}

export interface SlideColumnGroup {
  heading: string;
  dark?: boolean;
  items: SlideHighlight[];
}

export interface PresentationSlideData {
  id: string;
  indexNumber: string;
  kicker: string;
  title: string;
  subtitle: string;
  layout: SlideLayoutKind;
  darkTheme?: boolean;
  imageUrl?: string;
  imageCaption?: string;
  metrics?: SlideMetric[];
  highlights?: SlideHighlight[];
  columns?: SlideColumnGroup[];
  summaryStatement?: {
    label: string;
    text: string;
  };
  tableHeaders?: string[];
  tableRows?: string[][];
  speakerNotes: string;
}

export interface PresentationDeckInput {
  deckTitle: string;
  deckSubtitle: string;
  presenterName: string;
  products: Product[];
  locations: CountryLocation[];
  orders: Order[];
  users: User[];
  financialRecords: FinancialRecord[];
  activities: SystemActivity[];
}

export interface ExportPptxOptions extends PresentationDeckInput {
  selectedSlideIds?: string[];
  fileName?: string;
}

async function fetchImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const blob = await response.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(typeof reader.result === 'string' ? reader.result : null);
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export function buildFlorentineSlides(input: PresentationDeckInput): PresentationSlideData[] {
  const {
    deckTitle,
    deckSubtitle,
    presenterName,
    products,
    locations,
    orders,
    users,
    financialRecords,
    activities,
  } = input;

  const activeLocations = locations.filter((l) => l.isActive !== false);
  const countriesServed = Array.from(new Set(activeLocations.map((l) => l.country || 'Rwanda')));
  const inStockCount = products.filter((p) => p.inStock).length;
  const customerPermittedCount = products.filter((p) =>
    isProductPermittedForCustomerCapacity(p, null)
  ).length;
  const totalOrderRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const deliveredOrdersCount = orders.filter((o) => o.status === 'Delivered').length;
  const financeIncome = financialRecords
    .filter((f) => f.type === 'income')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);
  const financeExpense = financialRecords
    .filter((f) => f.type === 'expense')
    .reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

  const dateLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const safePresenter = presenterName || 'Florentine Mushimiyimana';

  return [
    {
      id: 'introduction-background',
      indexNumber: '01',
      kicker: `01. INTRODUCTION AND BACKGROUND · ${dateLabel.toUpperCase()}`,
      title: deckTitle || 'Florentine-Green (Fofo Green)',
      subtitle:
        deckSubtitle ||
        'A Digital Farm-to-Table Organic Produce Ecosystem Connecting Rwandan Cooperatives With Communities Everywhere',
      layout: 'cover',
      darkTheme: true,
      imageUrl: coverHarvestImg,
      imageCaption: `Presented by ${safePresenter} · Kigali, Rwanda`,
      highlights: [
        {
          title: 'Agricultural Heritage & Context',
          description: `Connects smallholder farms in Musanze, Gicumbi, Bugesera, and Nyagatare directly to households (${products.length} fresh SKUs).`,
        },
        {
          title: 'Ubiquitous Digital Access',
          description: `Enables customers anywhere across ${activeLocations.length} active zones (${countriesServed.join(', ')}) via Web, PWA, QR & USSD.`,
        },
        {
          title: 'Unified Multi-Role Operations',
          description: `Combines role-scoped shopping, live public Q&A customer care, and ${users.length} member workspaces with financial compliance.`,
        },
      ],
      speakerNotes:
        'Slide 1 (Introduction and Background): Introduce Florentine-Green (Fofo Green) as an end-to-end digital green-grocery platform born in Rwanda to bridge rural organic farming cooperatives and modern households or diaspora buyers.',
    },
    {
      id: 'community-problems',
      indexNumber: '02',
      kicker: '02. COMMUNITY PROBLEMS AND PROBLEM STATEMENT',
      title: 'Community Problems & Problem Statement',
      subtitle:
        'Why traditional fresh produce markets fail both rural cooperatives and everyday urban or diaspora shoppers.',
      layout: 'comparison-columns',
      columns: [
        {
          heading: 'Observed Community Problems',
          items: [
            {
              title: 'Multi-Layer Intermediaries & Price Markup',
              description:
                'Smallholder farmers earn low farm-gate prices while consumers pay inflated rates due to uncoordinated middlemen.',
            },
            {
              title: 'High Post-Harvest Spoilage & Waste',
              description:
                'Lack of demand forecasting, cold-chain crating, and real-time stock tracking causes perishable produce to spoil before sale.',
            },
            {
              title: 'Limited Geographic & Role Clarity',
              description:
                'Shoppers outside central markets struggle to verify delivery zones, fees, or which retail items they are permitted to buy.',
            },
            {
              title: 'Slow, Unverified Customer Communication',
              description:
                'Questions on produce freshness, sourcing, or delivery get lost in private chats with no authoritative admin verification.',
            },
          ],
        },
        {
          heading: 'Core Problem Statement',
          dark: true,
          items: [
            {
              title: 'Disconnected Farm-to-Table Infrastructure',
              description:
                'Communities lack a transparent, access-anywhere commerce system uniting verified harvest sourcing, role-scoped purchasing, dynamic delivery zone management, and public admin-moderated customer support.',
            },
            {
              title: 'Operational Blind Spots Across Staff',
              description:
                'Without shared inventory, POS receipting, and financial ledgers, local grocers lose stock visibility, delay farmer payouts, and struggle with RRA tax reconciliation.',
            },
          ],
        },
      ],
      summaryStatement: {
        label: 'Problem Statement Summary',
        text: 'How can Florentine-Green eliminate spoilage and market friction while giving every signed-in customer immediate, verified access to organic harvests anywhere?',
      },
      speakerNotes:
        'Slide 2 (Community Problems & Problem Statement): Contrast the four daily pain points experienced by farmers and shoppers against the concise problem statement driving our digital platform design.',
    },
    {
      id: 'proposed-solution',
      indexNumber: '03',
      kicker: '03. PROPOSED SOLUTION AND OBJECTIVES',
      title: 'Proposed Solution & Core Objectives',
      subtitle:
        'A resilient farm-to-table commerce platform combining instant customer access, cold-chain dispatch, and transparent governance.',
      layout: 'photo-editorial',
      imageUrl: deliveryHubImg,
      imageCaption: 'Fig. 1 — Florentine-Green Kigali cooperative sorting, cold-chain packing, and dispatch hub.',
      highlights: [
        {
          title: 'Objective 1 · Instant Role-Scoped Purchasing',
          description: `Allow customers to sign in and immediately purchase all ${customerPermittedCount} permitted consumer products while reserving bulk staff SKUs cleanly.`,
        },
        {
          title: 'Objective 2 · Access Anywhere Coverage',
          description: `Enable Admin management of country, province, district, and sector delivery zones (${activeLocations.length} live hubs) plus offline PWA support.`,
        },
        {
          title: 'Objective 3 · Open Q&A with Admin Authority',
          description:
            'Provide a shared public chat where anyone reads messages and asks questions, while only the Admin issues official answers.',
        },
        {
          title: 'Objective 4 · Traceable Fiscal Operations',
          description:
            'Automate batch stock intake, spoilage logging, MTN MoMo / Airtel Money settlement, and RRA EBM v2 compliant receipts.',
        },
      ],
      speakerNotes:
        'Slide 3 (Proposed Solution and Objectives): Walk through the 4 concrete engineering and community objectives directly implemented inside Florentine-Green.',
    },
    {
      id: 'target-users',
      indexNumber: '04',
      kicker: '04. TARGET USERS AND STAKEHOLDERS',
      title: 'Target Users & Key Stakeholders',
      subtitle:
        'Six role-scoped personas and ecosystem partners collaborating inside a single synchronized platform.',
      layout: 'grid-pillars',
      highlights: [
        {
          title: '01 · Retail & Diaspora Customers',
          description:
            'Urban households, professionals, and diaspora buyers ordering fresh food baskets with transparent fees and public support.',
        },
        {
          title: '02 · Farmers & Cooperatives',
          description:
            'Musanze, Bugesera, Nyagatare, and Gicumbi growers receiving reliable demand, fair payouts, and Farm Passport attribution.',
        },
        {
          title: '03 · Executive Administrator',
          description:
            'Governs catalog permissions, adds country delivery locations, audits system events, and publishes official Q&A answers.',
        },
        {
          title: '04 · Stock Manager',
          description:
            'Records incoming farm harvest batches, monitors expiry dates, manages damaged inventory, and resolves low-stock alerts.',
        },
        {
          title: '05 · Cashier & Sales Attendant',
          description:
            'Serves walk-in shoppers at kiosks, processes MTN MoMo / cash payments, and issues verified EBM digital receipts.',
        },
        {
          title: '06 · Accountant & Regulators',
          description:
            'Audits profit & loss ledgers, farmer disbursements, delivery logistics expenses, and RRA EBM v2 fiscal compliance.',
        },
      ],
      speakerNotes:
        'Slide 4 (Target Users and Stakeholders): Highlight both external community stakeholders (customers, diaspora, farmers, regulators) and internal staff roles supported by tailored dashboards.',
    },
    {
      id: 'system-features-workflow',
      indexNumber: '05',
      kicker: '05. SYSTEM FEATURES AND WORKFLOW',
      title: 'End-to-End System Features & Workflow',
      subtitle:
        'A seamless 6-stage operational flow from morning harvest intake to verified doorstep delivery and public Q&A resolution.',
      layout: 'grid-pillars',
      highlights: [
        {
          title: 'Step 1 · Harvest Intake & Farm Passport',
          description: `Stock Managers log cooperative batches across ${inStockCount}/${products.length} ready SKUs with batch numbers and soil/elevation origin.`,
        },
        {
          title: 'Step 2 · Customer Sign-In & Role Scoping',
          description:
            'Signed-in customers immediately unlock permitted retail items, cart controls, and order tracking from any browser or PWA.',
        },
        {
          title: 'Step 3 · Country Location & Tariff Sync',
          description:
            'Locations added by Admin in any country automatically appear in Delivery Zones, Access Anywhere, and Checkout calculation.',
        },
        {
          title: 'Step 4 · Omnichannel Checkout & Receipts',
          description:
            'Shoppers complete payments via MTN MoMo (*182#), Airtel Money, Visa/Card, or Cash on Delivery with instant EBM v2 receipting.',
        },
        {
          title: 'Step 5 · Cold-Chain Solar Moto Dispatch',
          description:
            'Orders route to couriers with district ETAs, insulated crating, live temperature telemetry, and status progression.',
        },
        {
          title: 'Step 6 · Public Q&A & Executive Reporting',
          description:
            'Customers type visible inquiries in live chat for Admin answers, while leadership exports ZIP/JSON backups and .pptx decks.',
        },
      ],
      speakerNotes:
        'Slide 5 (System Features and Workflow): Trace the lifecycle of an order step-by-step from farm batch logging all the way to doorstep handoff and executive reporting.',
    },
    {
      id: 'requirements',
      indexNumber: '06',
      kicker: '06. FUNCTIONAL AND NON-FUNCTIONAL REQUIREMENTS',
      title: 'Functional & Non-Functional Requirements',
      subtitle:
        'Clear engineering specifications governing user capabilities, access control, reliability, and performance.',
      layout: 'comparison-columns',
      columns: [
        {
          heading: 'Functional Requirements',
          items: [
            {
              title: 'Authentication & Role-Based Purchasing',
              description:
                'Sign-in flow immediately unlocks consumer-permitted products for customers while restricting wholesale/staff reserves.',
            },
            {
              title: 'Dynamic Country Location CRUD',
              description:
                'Admin creates, edits, toggles, or removes countries, provinces, districts, sectors, fees, and fulfillment modes.',
            },
            {
              title: 'Public Q&A Community Chat Engine',
              description:
                'Visible real-time message feed where anyone posts questions/replies and only Admin submits official answers.',
            },
            {
              title: 'POS, Ledger & Presentation Exports',
              description:
                'Generate RRA EBM receipts, P&L records, JSON/ZIP data archives, and 16:9 PowerPoint (.pptx) presentations.',
            },
          ],
        },
        {
          heading: 'Non-Functional Requirements',
          dark: true,
          items: [
            {
              title: 'Availability & Offline PWA Resilience',
              description:
                'Service-worker asset caching and localStorage fallback keep catalog browsing and cart state intact during network drops.',
            },
            {
              title: 'Real-Time Latency & Synchronization',
              description:
                'Sub-second chat delivery and state broadcasting via WebSockets (`ws`) paired with Firestore snapshot persistence.',
            },
            {
              title: 'Security & Rule Enforcement',
              description:
                'Server-side permission checks, role validation, Firestore security rules, and explicit activity audit logs.',
            },
            {
              title: 'Usability, Accessibility & Localization',
              description:
                'Decluttered selection-state navigation, mobile-first layout, and 5 languages (EN, RW, FR, ES, AR).',
            },
          ],
        },
      ],
      summaryStatement: {
        label: 'Live Compliance Baseline',
        text: `Currently enforcing ${activities.length} audited system events, role-scoped permissions across ${users.length} profiles, and strict Firestore rules.`,
      },
      speakerNotes:
        'Slide 6 (Functional and Non-Functional Requirements): Distinguish what the system does (Functional) from how reliably, securely, and fast it operates (Non-Functional).',
    },
    {
      id: 'tech-architecture',
      indexNumber: '07',
      kicker: '07. TECHNOLOGIES AND SYSTEM ARCHITECTURE',
      title: 'Technology Stack & System Architecture',
      subtitle:
        'A full-stack TypeScript architecture combining reactive UI rendering, real-time sockets, relational SQL, and cloud sync.',
      layout: 'table',
      tableHeaders: ['Architecture Layer', 'Technologies & Libraries', 'Core System Responsibility'],
      tableRows: [
        [
          'Frontend & Styling',
          'React 19 · TypeScript · Vite 8 · Tailwind CSS v4',
          'Modular 6-role UI, accessible modals, responsive catalog & editorial deck studio',
        ],
        [
          'Offline & Mobility',
          'vite-plugin-pwa · QRCode · Deep-Link URLs',
          'Installable web app, catalog caching, USSD/WhatsApp & cross-device QR handoff',
        ],
        [
          'Real-Time Layer',
          'WebSocket (ws) · Firebase Firestore · Presence API',
          'Live visible Q&A messages, online presence indicators, instant Admin answer sync',
        ],
        [
          'Backend API Server',
          'Node.js · Express · tsx (server.ts)',
          'REST endpoints (/api/locations, /api/chat, /api/orders), health & middleware',
        ],
        [
          'Database & Security',
          'PostgreSQL (pg) · Drizzle ORM · Firebase Auth & Rules',
          'Relational persistence, schema migrations, authenticated RBAC & Firestore rules',
        ],
        [
          'Document & Payment',
          'PptxGenJS · MTN MoMo / Airtel · RRA EBM v2 Engine',
          'Client-side .pptx generation, mobile money payment flows, fiscal receipts',
        ],
      ],
      highlights: [
        {
          title: 'Hybrid Dual-Persistence Pattern',
          description:
            'PostgreSQL + Drizzle manages structured catalog, order, and country location data while Firestore + WebSockets stream live community Q&A.',
        },
        {
          title: 'Clean Client-Server Separation',
          description:
            'Vite serves optimized TypeScript bundles while Express coordinates API routes, static delivery, and WebSocket rooms on port 3000.',
        },
      ],
      speakerNotes:
        'Slide 7 (Technologies and System Architecture): Explain how each architectural tier works together — React 19 UI, WebSocket + Firestore real-time bus, Express API, and PostgreSQL/Drizzle storage.',
    },
    {
      id: 'community-benefits',
      indexNumber: '08',
      kicker: '08. EXPECTED COMMUNITY BENEFITS',
      title: 'Expected Social & Economic Community Benefits',
      subtitle:
        'Measurable impact for farmers, families, diaspora supporters, and local food sustainability.',
      layout: 'metrics-split',
      metrics: [
        {
          label: 'Active Product Accessibility',
          value: `${customerPermittedCount} / ${products.length}`,
          detail: 'Consumer produce items immediately unlocked upon customer sign-in',
        },
        {
          label: 'Geographic Reach Managed',
          value: `${activeLocations.length} Hubs`,
          detail: `Serving ${countriesServed.length} ${countriesServed.length === 1 ? 'country' : 'countries'} (${countriesServed.join(', ')}) with transparent FRW tariffs`,
        },
        {
          label: 'Tracked Order Throughput',
          value: `${orders.length} Orders`,
          detail: `${totalOrderRevenue.toLocaleString()} FRW order value · ${deliveredOrdersCount} completed deliveries`,
        },
        {
          label: 'Financial Transparency',
          value: `${financeIncome.toLocaleString()} FRW`,
          detail: `Audited inflows balanced against ${financeExpense.toLocaleString()} FRW in cooperative & ops costs`,
        },
      ],
      highlights: [
        {
          title: 'Higher Farmer Incomes & Reduced Spoilage',
          description:
            'Direct cooperative ordering cuts unnecessary middlemen and shortens harvest-to-kitchen time to under 45 minutes in Kigali.',
        },
        {
          title: 'Digital Inclusion & Diaspora Remittance Impact',
          description:
            'Families abroad can securely fund nutritious grocery deliveries to relatives back home with verifiable digital receipts.',
        },
      ],
      speakerNotes:
        'Slide 8 (Expected Community Benefits): Connect the platform capabilities directly to real community uplift: farmer earnings, fresher household nutrition, reduced food waste, and transparent diaspora gifting.',
    },
    {
      id: 'challenges-solutions',
      indexNumber: '09',
      kicker: '09. CHALLENGES AND SOLUTIONS',
      title: 'Engineering & Operational Challenges Solved',
      subtitle:
        'Key obstacles encountered during platform development and the concrete architectural solutions implemented.',
      layout: 'table',
      tableHeaders: ['Challenge Encountered', 'Root Cause / Risk', 'Implemented Solution in Florentine-Green'],
      tableRows: [
        [
          'Intermittent Mobile Connectivity',
          'Rural hubs & mobile shoppers experience dropped 3G/4G connections',
          'Offline PWA service-worker caching, persisted cart state, and resilient fallback storage',
        ],
        [
          'Uncontrolled Chat Noise vs. Authority',
          'Open chat needs public visibility without misleading unofficial answers',
          'Public Q&A model: anyone posts questions/replies; only Admin role can publish official answers',
        ],
        [
          'Customer vs. Bulk Role Confusion',
          'Customers attempting to buy internal or out-of-scope bulk inventory',
          'Dedicated `purchasePermissions` helper immediately unlocking retail SKUs on customer sign-in',
        ],
        [
          'Expanding Beyond Single-City Delivery',
          'Hardcoded districts block new provinces or cross-border expansion',
          'Admin Country Locations Manager with live CRUD synced to Delivery, Access Anywhere & Checkout',
        ],
        [
          'Navigation Clutter Across 6 Roles',
          'Too many workspace & tool buttons crowd smaller viewports',
          'Active selection-state indicators and consolidated "More..." quick-tools drawer in Navbar',
        ],
      ],
      highlights: [
        {
          title: 'Real-Time Delivery Verification',
          description:
            'Synchronized HTTP REST persistence with WebSocket broadcasts so newly typed chat messages appear immediately to Admin.',
        },
        {
          title: 'Fiscal Trust in Mobile Money',
          description:
            'Coupled MTN MoMo (*182#) confirmation states with automated RRA EBM v2 receipt records and Accountant auditing.',
        },
      ],
      speakerNotes:
        'Slide 9 (Challenges and Solutions): Walk evaluators through real technical and operational challenges we actively solved in the codebase.',
    },
    {
      id: 'implementation-future',
      indexNumber: '10',
      kicker: '10. IMPLEMENTATION PLAN AND FUTURE IMPROVEMENTS',
      title: 'Implementation Plan & Future Improvements',
      subtitle:
        'Structured rollout phases from the current production foundation toward regional smart-agriculture scale.',
      layout: 'roadmap',
      highlights: [
        {
          title: 'Phase 1 · Core Platform (Completed)',
          description:
            '6-role workspaces, customer-scoped catalog, Admin Country Locations CRUD, live Public Q&A chat, EBM v2 receipts, and .pptx Deck Studio.',
        },
        {
          title: 'Phase 2 · Cooperative & Regional Rollout',
          description:
            'Onboard additional provincial hubs (Musanze, Rubavu, Huye, Rwamagana) and cross-border EAC delivery corridors via Admin Locations.',
        },
        {
          title: 'Phase 3 · Future Smart Improvements',
          description:
            'Live MTN MoMo / RRA EBM production API webhooks, automated SMS/USSD status alerts, IoT cold-chain crate sensors, and harvest demand forecasting.',
        },
      ],
      metrics: [
        {
          label: 'Near-Term Milestone (Q1–Q2)',
          value: '100% Hub Digitization',
          detail: 'Expand verified cooperative Farm Passports & sub-hour electric moto dispatch',
        },
        {
          label: 'Long-Term Expansion (Q3–Q4)',
          value: 'Regional EAC & B2B Supply',
          detail: 'Hospitality recurring procurement contracts & automated cooperative payouts',
        },
      ],
      speakerNotes:
        'Slide 10 (Implementation Plan and Future Improvements): Clearly separate what is already implemented and running today (Phase 1) from Phase 2 geographic rollout and Phase 3 smart-logistics upgrades.',
    },
    {
      id: 'testing-conclusion-questions',
      indexNumber: '11',
      kicker: '11. TESTING, CONCLUSION AND QUESTIONS',
      title: 'Testing, Conclusion & Discussion Questions',
      subtitle:
        'Verified build integrity, functional end-to-end validation, final conclusions, and open floor for questions.',
      layout: 'closing-qa',
      highlights: [
        {
          title: '1. Static Type & Build Verification',
          description:
            'Validated across strict TypeScript (`tsc --noEmit`), Vite production bundling, and Firestore security rules verification.',
        },
        {
          title: '2. Functional Workflow Testing',
          description:
            'Verified customer sign-in product permissions, Admin Country Location CRUD, public chat message visibility & Admin replies, and .pptx binary export.',
        },
        {
          title: '3. Cross-Device & Runtime Checks',
          description:
            'Tested responsive desktop/mobile navigation selection states, Express API endpoints, WebSocket chat sync, and offline PWA fallback.',
        },
      ],
      summaryStatement: {
        label: 'Conclusion',
        text: 'Florentine-Green (Fofo Green) proves that accessible web engineering, cooperative traceability, and role-governed real-time workflows can transform fresh food distribution while empowering both farmers and communities everywhere.',
      },
      metrics: [
        {
          label: 'Questions & Answers · Presenter',
          value: safePresenter,
          detail: 'florentinemushimiyimana1@gmail.com · Kigali HQ',
        },
        {
          label: 'Live Platform & Support Channels',
          value: 'Thank You! Questions?',
          detail: 'Interactive Q&A Lounge open · +250 788 234 567',
        },
      ],
      speakerNotes:
        'Slide 11 (Testing, Conclusion and Questions): Summarize verification results (tsc --noEmit, Vite build, functional workflows), deliver the closing conclusion, and invite audience questions.',
    },
  ];
}

export async function exportFlorentinePptx(
  options: ExportPptxOptions
): Promise<{ fileName: string; slideCount: number }> {
  const allSlides = buildFlorentineSlides(options);
  const selectedIds = options.selectedSlideIds;
  const slidesToExport =
    selectedIds && selectedIds.length > 0
      ? allSlides.filter((s) => selectedIds.includes(s.id))
      : allSlides;

  const PptxCtor =
    (PptxGenJS as unknown as { default?: typeof PptxGenJS }).default || PptxGenJS;
  const pptx = new PptxCtor();
  pptx.layout = 'LAYOUT_16x9';
  pptx.author = options.presenterName || 'Florentine Mushimiyimana';
  pptx.company = 'Florentine-Green (Fofo Green Rwanda)';
  pptx.title = options.deckTitle || 'Florentine-Green Presentation';
  pptx.subject = options.deckSubtitle || 'Farm-to-Table Organic Produce Platform';

  const [coverDataUrl, hubDataUrl] = await Promise.all([
    fetchImageAsDataUrl(coverHarvestImg),
    fetchImageAsDataUrl(deliveryHubImg),
  ]);

  const COLORS = {
    cream: 'FBF9F5',
    stoneSurface: 'F2EFE9',
    darkGreen: '064E3B',
    deepForest: '022C22',
    emerald: '047857',
    ink: '1C1917',
    muted: '57534E',
    border: 'D6D3D1',
    white: 'FFFFFF',
    lightText: 'E7E5E4',
    emeraldLight: 'A7F3D0',
  };

  slidesToExport.forEach((slideData, idx) => {
    const slide = pptx.addSlide();
    const isDark = Boolean(slideData.darkTheme);
    slide.background = { color: isDark ? COLORS.deepForest : COLORS.cream };

    // Top thin editorial hairline bar
    slide.addShape(pptx.ShapeType.rect, {
      x: 0.6,
      y: 0.4,
      w: 12.13,
      h: 0.015,
      fill: { color: isDark ? '115E59' : COLORS.border },
      line: { type: 'none' },
    });

    // Kicker label
    slide.addText(slideData.kicker, {
      x: 0.6,
      y: 0.48,
      w: 10.2,
      h: 0.28,
      fontFace: 'Calibri',
      fontSize: 9.5,
      bold: true,
      charSpacing: 1.4,
      color: isDark ? COLORS.emeraldLight : COLORS.emerald,
    });

    // Slide index top-right
    slide.addText(
      `${String(idx + 1).padStart(2, '0')} / ${String(slidesToExport.length).padStart(2, '0')}`,
      {
        x: 11.2,
        y: 0.48,
        w: 1.53,
        h: 0.28,
        align: 'right',
        fontFace: 'Calibri',
        fontSize: 9.5,
        bold: true,
        color: isDark ? COLORS.lightText : COLORS.muted,
      }
    );

    if (slideData.layout === 'cover') {
      slide.addText(slideData.title, {
        x: 0.6,
        y: 1.1,
        w: 6.0,
        h: 1.45,
        fontFace: 'Georgia',
        fontSize: 33,
        bold: true,
        color: COLORS.white,
        valign: 'top',
      });

      slide.addText(slideData.subtitle, {
        x: 0.6,
        y: 2.65,
        w: 5.9,
        h: 1.05,
        fontFace: 'Calibri',
        fontSize: 13,
        color: COLORS.lightText,
        valign: 'top',
      });

      (slideData.highlights || []).slice(0, 3).forEach((hl, hIdx) => {
        const yPos = 3.98 + hIdx * 0.92;
        slide.addShape(pptx.ShapeType.rect, {
          x: 0.6,
          y: yPos,
          w: 5.9,
          h: 0.8,
          fill: { color: COLORS.darkGreen },
          line: { color: '065F46', width: 0.75 },
        });
        slide.addText(hl.title, {
          x: 0.78,
          y: yPos + 0.08,
          w: 5.55,
          h: 0.24,
          fontFace: 'Calibri',
          fontSize: 10.5,
          bold: true,
          color: COLORS.emeraldLight,
        });
        slide.addText(hl.description, {
          x: 0.78,
          y: yPos + 0.34,
          w: 5.55,
          h: 0.4,
          fontFace: 'Calibri',
          fontSize: 9,
          color: COLORS.lightText,
        });
      });

      if (coverDataUrl) {
        slide.addImage({
          data: coverDataUrl,
          x: 6.85,
          y: 1.1,
          w: 5.88,
          h: 5.02,
          sizing: { type: 'cover', w: 5.88, h: 5.02 },
        });
      } else {
        slide.addShape(pptx.ShapeType.rect, {
          x: 6.85,
          y: 1.1,
          w: 5.88,
          h: 5.02,
          fill: { color: COLORS.darkGreen },
          line: { color: COLORS.emerald, width: 1 },
        });
      }

      if (slideData.imageCaption) {
        slide.addText(slideData.imageCaption, {
          x: 6.85,
          y: 6.22,
          w: 5.88,
          h: 0.3,
          fontFace: 'Georgia',
          fontSize: 9.5,
          italic: true,
          color: COLORS.emeraldLight,
        });
      }
    } else {
      // Standard Light Editorial Header
      slide.addText(slideData.title, {
        x: 0.6,
        y: 0.82,
        w: 12.13,
        h: 0.56,
        fontFace: 'Georgia',
        fontSize: 24,
        bold: true,
        color: COLORS.ink,
      });

      slide.addText(slideData.subtitle, {
        x: 0.6,
        y: 1.4,
        w: 11.6,
        h: 0.42,
        fontFace: 'Calibri',
        fontSize: 11,
        color: COLORS.muted,
      });

      if (slideData.layout === 'comparison-columns') {
        const cols = (slideData.columns || []).slice(0, 2);
        cols.forEach((col, cIdx) => {
          const x = 0.6 + cIdx * 6.18;
          const colDark = Boolean(col.dark);
          slide.addShape(pptx.ShapeType.rect, {
            x,
            y: 1.98,
            w: 5.95,
            h: 3.9,
            fill: { color: colDark ? COLORS.deepForest : COLORS.white },
            line: { color: colDark ? COLORS.darkGreen : COLORS.border, width: 0.75 },
          });

          slide.addText(col.heading.toUpperCase(), {
            x: x + 0.22,
            y: 2.12,
            w: 5.5,
            h: 0.28,
            fontFace: 'Calibri',
            fontSize: 10,
            bold: true,
            charSpacing: 0.8,
            color: colDark ? COLORS.emeraldLight : COLORS.darkGreen,
          });

          const maxItems = col.items.slice(0, 4);
          const itemGap = maxItems.length <= 2 ? 1.55 : 0.84;
          maxItems.forEach((item, iIdx) => {
            const iy = 2.48 + iIdx * itemGap;
            slide.addText(item.title, {
              x: x + 0.22,
              y: iy,
              w: 5.5,
              h: 0.24,
              fontFace: 'Georgia',
              fontSize: 10.5,
              bold: true,
              color: colDark ? COLORS.white : COLORS.ink,
            });
            slide.addText(item.description, {
              x: x + 0.22,
              y: iy + 0.24,
              w: 5.5,
              h: maxItems.length <= 2 ? 1.15 : 0.54,
              fontFace: 'Calibri',
              fontSize: 9.2,
              color: colDark ? COLORS.lightText : COLORS.muted,
              valign: 'top',
            });
          });
        });

        if (slideData.summaryStatement) {
          slide.addShape(pptx.ShapeType.rect, {
            x: 0.6,
            y: 6.0,
            w: 12.13,
            h: 0.76,
            fill: { color: COLORS.stoneSurface },
            line: { color: COLORS.border, width: 0.75 },
          });
          slide.addText(
            `${slideData.summaryStatement.label.toUpperCase()}: ${slideData.summaryStatement.text}`,
            {
              x: 0.82,
              y: 6.1,
              w: 11.7,
              h: 0.56,
              fontFace: 'Calibri',
              fontSize: 9.8,
              bold: true,
              color: COLORS.darkGreen,
              valign: 'middle',
            }
          );
        }
      } else if (slideData.layout === 'metrics-split') {
        const metrics = (slideData.metrics || []).slice(0, 4);
        metrics.forEach((m, mIdx) => {
          const col = mIdx % 2;
          const row = Math.floor(mIdx / 2);
          const x = 0.6 + col * 6.18;
          const y = 2.02 + row * 1.66;
          slide.addShape(pptx.ShapeType.rect, {
            x,
            y,
            w: 5.95,
            h: 1.48,
            fill: { color: COLORS.white },
            line: { color: COLORS.border, width: 0.75 },
          });
          slide.addText(m.label.toUpperCase(), {
            x: x + 0.24,
            y: y + 0.16,
            w: 5.4,
            h: 0.24,
            fontFace: 'Calibri',
            fontSize: 9,
            bold: true,
            charSpacing: 0.8,
            color: COLORS.muted,
          });
          slide.addText(m.value, {
            x: x + 0.24,
            y: y + 0.42,
            w: 5.4,
            h: 0.48,
            fontFace: 'Georgia',
            fontSize: 22,
            bold: true,
            color: COLORS.darkGreen,
          });
          slide.addText(m.detail, {
            x: x + 0.24,
            y: y + 0.96,
            w: 5.45,
            h: 0.4,
            fontFace: 'Calibri',
            fontSize: 9.5,
            color: COLORS.muted,
          });
        });

        (slideData.highlights || []).slice(0, 2).forEach((hl, hIdx) => {
          const x = 0.6 + hIdx * 6.18;
          slide.addShape(pptx.ShapeType.rect, {
            x,
            y: 5.46,
            w: 5.95,
            h: 1.24,
            fill: { color: COLORS.stoneSurface },
            line: { color: COLORS.border, width: 0.75 },
          });
          slide.addText(hl.title, {
            x: x + 0.22,
            y: 5.58,
            w: 5.5,
            h: 0.26,
            fontFace: 'Calibri',
            fontSize: 11,
            bold: true,
            color: COLORS.ink,
          });
          slide.addText(hl.description, {
            x: x + 0.22,
            y: 5.88,
            w: 5.5,
            h: 0.72,
            fontFace: 'Calibri',
            fontSize: 9.5,
            color: COLORS.muted,
          });
        });
      } else if (slideData.layout === 'photo-editorial') {
        if (hubDataUrl) {
          slide.addImage({
            data: hubDataUrl,
            x: 0.6,
            y: 2.02,
            w: 6.25,
            h: 4.25,
            sizing: { type: 'cover', w: 6.25, h: 4.25 },
          });
        } else {
          slide.addShape(pptx.ShapeType.rect, {
            x: 0.6,
            y: 2.02,
            w: 6.25,
            h: 4.25,
            fill: { color: COLORS.stoneSurface },
            line: { color: COLORS.border, width: 0.75 },
          });
        }
        if (slideData.imageCaption) {
          slide.addText(slideData.imageCaption, {
            x: 0.6,
            y: 6.34,
            w: 6.25,
            h: 0.34,
            fontFace: 'Georgia',
            fontSize: 9,
            italic: true,
            color: COLORS.muted,
          });
        }

        (slideData.highlights || []).slice(0, 4).forEach((hl, hIdx) => {
          const y = 2.02 + hIdx * 1.15;
          slide.addShape(pptx.ShapeType.rect, {
            x: 7.12,
            y,
            w: 5.61,
            h: 1.02,
            fill: { color: COLORS.white },
            line: { color: COLORS.border, width: 0.75 },
          });
          slide.addText(hl.title, {
            x: 7.32,
            y: y + 0.1,
            w: 5.2,
            h: 0.25,
            fontFace: 'Calibri',
            fontSize: 10.5,
            bold: true,
            color: COLORS.darkGreen,
          });
          slide.addText(hl.description, {
            x: 7.32,
            y: y + 0.37,
            w: 5.2,
            h: 0.56,
            fontFace: 'Calibri',
            fontSize: 9.2,
            color: COLORS.muted,
          });
        });
      } else if (slideData.layout === 'table') {
        const headers = slideData.tableHeaders || [];
        const rows = slideData.tableRows || [];
        const tableRows: PptxGenJS.TableRow[] = [
          headers.map((h) => ({
            text: h,
            options: {
              bold: true,
              fontFace: 'Calibri',
              fontSize: 10,
              color: COLORS.white,
              fill: { color: COLORS.darkGreen },
              valign: 'middle' as const,
            },
          })),
          ...rows.map((r, rIdx) =>
            r.map((cell) => ({
              text: cell,
              options: {
                fontFace: 'Calibri',
                fontSize: 9.2,
                color: COLORS.ink,
                fill: { color: rIdx % 2 === 0 ? COLORS.white : COLORS.stoneSurface },
                valign: 'middle' as const,
              },
            }))
          ),
        ];

        slide.addTable(tableRows, {
          x: 0.6,
          y: 2.0,
          w: 12.13,
          rowH: 0.48,
          border: { pt: 0.5, color: COLORS.border },
        });

        (slideData.highlights || []).slice(0, 2).forEach((hl, hIdx) => {
          const x = 0.6 + hIdx * 6.18;
          slide.addShape(pptx.ShapeType.rect, {
            x,
            y: 5.56,
            w: 5.95,
            h: 1.14,
            fill: { color: COLORS.white },
            line: { color: COLORS.border, width: 0.75 },
          });
          slide.addText(hl.title, {
            x: x + 0.22,
            y: 5.68,
            w: 5.5,
            h: 0.24,
            fontFace: 'Calibri',
            fontSize: 10.8,
            bold: true,
            color: COLORS.darkGreen,
          });
          slide.addText(hl.description, {
            x: x + 0.22,
            y: 5.95,
            w: 5.5,
            h: 0.65,
            fontFace: 'Calibri',
            fontSize: 9.3,
            color: COLORS.muted,
          });
        });
      } else if (slideData.layout === 'grid-pillars') {
        (slideData.highlights || []).slice(0, 6).forEach((hl, hIdx) => {
          const col = hIdx % 3;
          const row = Math.floor(hIdx / 3);
          const x = 0.6 + col * 4.11;
          const y = 2.02 + row * 2.34;
          slide.addShape(pptx.ShapeType.rect, {
            x,
            y,
            w: 3.9,
            h: 2.12,
            fill: { color: COLORS.white },
            line: { color: COLORS.border, width: 0.75 },
          });
          slide.addText(hl.title, {
            x: x + 0.22,
            y: y + 0.18,
            w: 3.46,
            h: 0.36,
            fontFace: 'Georgia',
            fontSize: 12,
            bold: true,
            color: COLORS.darkGreen,
          });
          slide.addText(hl.description, {
            x: x + 0.22,
            y: y + 0.62,
            w: 3.46,
            h: 1.32,
            fontFace: 'Calibri',
            fontSize: 9.8,
            color: COLORS.muted,
            valign: 'top',
          });
        });
      } else if (slideData.layout === 'roadmap') {
        (slideData.highlights || []).slice(0, 3).forEach((hl, hIdx) => {
          const x = 0.6 + hIdx * 4.11;
          slide.addShape(pptx.ShapeType.rect, {
            x,
            y: 2.02,
            w: 3.9,
            h: 2.68,
            fill: { color: COLORS.white },
            line: { color: COLORS.border, width: 0.75 },
          });
          slide.addText(hl.title, {
            x: x + 0.22,
            y: 2.22,
            w: 3.46,
            h: 0.46,
            fontFace: 'Georgia',
            fontSize: 12.5,
            bold: true,
            color: COLORS.darkGreen,
          });
          slide.addText(hl.description, {
            x: x + 0.22,
            y: 2.78,
            w: 3.46,
            h: 1.72,
            fontFace: 'Calibri',
            fontSize: 10,
            color: COLORS.muted,
            valign: 'top',
          });
        });

        (slideData.metrics || []).slice(0, 2).forEach((m, mIdx) => {
          const x = 0.6 + mIdx * 6.18;
          slide.addShape(pptx.ShapeType.rect, {
            x,
            y: 4.98,
            w: 5.95,
            h: 1.66,
            fill: { color: COLORS.deepForest },
            line: { color: COLORS.darkGreen, width: 0.75 },
          });
          slide.addText(m.label.toUpperCase(), {
            x: x + 0.24,
            y: 5.14,
            w: 5.4,
            h: 0.24,
            fontFace: 'Calibri',
            fontSize: 9,
            bold: true,
            color: COLORS.emeraldLight,
          });
          slide.addText(m.value, {
            x: x + 0.24,
            y: 5.42,
            w: 5.4,
            h: 0.46,
            fontFace: 'Georgia',
            fontSize: 16,
            bold: true,
            color: COLORS.white,
          });
          slide.addText(m.detail, {
            x: x + 0.24,
            y: 5.96,
            w: 5.4,
            h: 0.42,
            fontFace: 'Calibri',
            fontSize: 9.8,
            color: COLORS.lightText,
          });
        });
      } else if (slideData.layout === 'closing-qa') {
        (slideData.highlights || []).slice(0, 3).forEach((hl, hIdx) => {
          const x = 0.6 + hIdx * 4.11;
          slide.addShape(pptx.ShapeType.rect, {
            x,
            y: 2.0,
            w: 3.9,
            h: 2.0,
            fill: { color: COLORS.white },
            line: { color: COLORS.border, width: 0.75 },
          });
          slide.addText(hl.title, {
            x: x + 0.22,
            y: 2.18,
            w: 3.46,
            h: 0.36,
            fontFace: 'Georgia',
            fontSize: 11.8,
            bold: true,
            color: COLORS.darkGreen,
          });
          slide.addText(hl.description, {
            x: x + 0.22,
            y: 2.62,
            w: 3.46,
            h: 1.24,
            fontFace: 'Calibri',
            fontSize: 9.6,
            color: COLORS.muted,
            valign: 'top',
          });
        });

        if (slideData.summaryStatement) {
          slide.addShape(pptx.ShapeType.rect, {
            x: 0.6,
            y: 4.18,
            w: 12.13,
            h: 1.0,
            fill: { color: COLORS.stoneSurface },
            line: { color: COLORS.border, width: 0.75 },
          });
          slide.addText(slideData.summaryStatement.label.toUpperCase(), {
            x: 0.82,
            y: 4.28,
            w: 11.7,
            h: 0.22,
            fontFace: 'Calibri',
            fontSize: 9,
            bold: true,
            color: COLORS.emerald,
          });
          slide.addText(slideData.summaryStatement.text, {
            x: 0.82,
            y: 4.52,
            w: 11.7,
            h: 0.56,
            fontFace: 'Calibri',
            fontSize: 10,
            color: COLORS.ink,
          });
        }

        (slideData.metrics || []).slice(0, 2).forEach((m, mIdx) => {
          const x = 0.6 + mIdx * 6.18;
          slide.addShape(pptx.ShapeType.rect, {
            x,
            y: 5.34,
            w: 5.95,
            h: 1.38,
            fill: { color: COLORS.deepForest },
            line: { color: COLORS.darkGreen, width: 0.75 },
          });
          slide.addText(m.label.toUpperCase(), {
            x: x + 0.24,
            y: 5.48,
            w: 5.4,
            h: 0.22,
            fontFace: 'Calibri',
            fontSize: 9,
            bold: true,
            color: COLORS.emeraldLight,
          });
          slide.addText(m.value, {
            x: x + 0.24,
            y: 5.74,
            w: 5.4,
            h: 0.42,
            fontFace: 'Georgia',
            fontSize: 16,
            bold: true,
            color: COLORS.white,
          });
          slide.addText(m.detail, {
            x: x + 0.24,
            y: 6.22,
            w: 5.4,
            h: 0.34,
            fontFace: 'Calibri',
            fontSize: 9.5,
            color: COLORS.lightText,
          });
        });
      }
    }

    // Subtle Footer Attribution
    slide.addText(
      `Florentine-Green (Fofo Green Rwanda) · ${options.presenterName || 'Florentine Mushimiyimana'}`,
      {
        x: 0.6,
        y: 6.95,
        w: 12.13,
        h: 0.25,
        fontFace: 'Calibri',
        fontSize: 8.5,
        color: isDark ? COLORS.emeraldLight : COLORS.muted,
      }
    );

    slide.addNotes(slideData.speakerNotes);
  });

  const cleanFileName = (options.fileName || 'Florentine-Green-Presentation.pptx').endsWith('.pptx')
    ? options.fileName || 'Florentine-Green-Presentation.pptx'
    : `${options.fileName}.pptx`;

  await pptx.writeFile({ fileName: cleanFileName });
  return { fileName: cleanFileName, slideCount: slidesToExport.length };
}
