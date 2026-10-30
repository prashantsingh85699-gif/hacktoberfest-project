export function getDemoScanFixture(hints = {}) {
  const categoryHint = (hints.category || '').toLowerCase();
  const productHint = (hints.productHint || '').toLowerCase();

  // Scenario 3: Medicine with unreadable expiry -> ends in UNKNOWN
  if (categoryHint === 'medicine' || productHint.includes('med') || productHint.includes('pharma') || productHint.includes('pill')) {
    return {
      product: {
        category: 'medicine',
        categoryConfidence: 0.95,
        name: 'Demo-Cillin 500mg (Demo Scenario: Medicine with Unreadable Expiry)',
        brand: 'DemoHealth Pharma',
        manufacturer: 'DemoHealth Laboratories Pvt Ltd',
        variant: '500mg',
        strength: '500mg',
        dosageForm: 'Capsule',
        netQuantity: '10 Capsules',
        packagingType: 'blister_strip',
        identityConfidence: 0.88,
        identityEvidence: 'Blister foil text reads Demo-Cillin 500mg, manufacturer DemoHealth.',
      },
      dates: [
        {
          kind: 'MFG',
          rawText: 'MFD 01/2025',
          imageIndex: 0,
          modelConfidence: 0.9,
        },
      ],
      labelRules: [],
      batchNumbers: [
        { labelText: 'Batch No.', value: 'DM-7749', imageIndex: 0, confidence: 0.85 },
      ],
      damage: {
        assessed: true,
        findings: [
          {
            type: 'damaged_label',
            severity: 'moderate',
            evidence: 'Crimped blister edge has abrasion obscuring printed expiry numbers.',
            imageIndex: 0,
            box2d: [150, 620, 320, 910],
            confidence: 0.8,
          },
        ],
        limitations: 'Medicine chemical integrity cannot be verified from blister photos.',
      },
      imageQuality: [
        { issues: 'faded_print', note: 'Expiration print on crimped margin is partially rubbed off.' },
      ],
      storageInstructions: 'Store below 25°C in a dry place. Protect from light.',
      customerContact: {
        phone: '1800-DEMO-MED',
        email: 'safety@example.com',
        website: 'https://example.com/demo-pharma',
      },
      isDemo: true,
      demoScenario: 'medicine_unreadable',
    };
  }

  // Scenario 2: Cosmetic with MFG + batch, no EXP, PAO 12M -> eligible for manufacturer investigation
  if (categoryHint === 'cosmetic' || productHint.includes('cream') || productHint.includes('lotion') || productHint.includes('serum')) {
    return {
      product: {
        category: 'cosmetic',
        categoryConfidence: 0.96,
        name: 'Hydra-Glow Vitamin C Serum (Demo Scenario: Missing Expiry)',
        brand: 'DemoBrand Skin',
        manufacturer: 'DemoBrand Cosmeceuticals Ltd',
        variant: 'Radiance Booster',
        strength: '10% Vit C',
        dosageForm: 'Serum',
        netQuantity: '30 ml',
        packagingType: 'glass_dropper_bottle',
        identityConfidence: 0.92,
        identityEvidence: 'Front label reads Hydra-Glow Serum 30ml by DemoBrand.',
      },
      dates: [
        {
          kind: 'MFG',
          rawText: 'MFG 15/01/2026',
          imageIndex: 0,
          modelConfidence: 0.94,
        },
      ],
      labelRules: [],
      batchNumbers: [
        { labelText: 'LOT', value: 'DB-LOT-904', imageIndex: 0, confidence: 0.9 },
      ],
      pao: {
        present: true,
        months: 12,
        rawText: '12M',
      },
      damage: {
        assessed: true,
        findings: [],
        limitations: 'Contents cannot be judged from bottle photos.',
      },
      imageQuality: [],
      storageInstructions: 'Store in a cool dark place. Keep cap tightly closed.',
      customerContact: {
        phone: '+1-800-DEMO-CARE',
        email: 'hello@example.com',
        website: 'https://example.com/demo-brand',
      },
      isDemo: true,
      demoScenario: 'cosmetic_missing_expiry',
    };
  }

  // Scenario 1: Food with clear printed expiry and OCR/AI agreement
  return {
    product: {
      category: 'food',
      categoryConfidence: 0.98,
      name: 'Whole Grain Rolled Oats (Demo Scenario: Printed Expiry Verified)',
      brand: 'Harvest demoOrganics',
      manufacturer: 'Harvest Organics Foodworks',
      variant: 'Quick Cooking',
      strength: '',
      dosageForm: '',
      netQuantity: '1 kg',
      packagingType: 'resealable_pouch',
      identityConfidence: 0.95,
      identityEvidence: 'Front pouch reads Harvest demoOrganics Whole Grain Rolled Oats 1kg.',
    },
    dates: [
      {
        kind: 'MFG',
        rawText: 'MFG 15/11/2025',
        imageIndex: 0,
        modelConfidence: 0.96,
      },
      {
        kind: 'EXP',
        rawText: 'EXP 15/11/2026',
        imageIndex: 0,
        modelConfidence: 0.97,
      },
    ],
    labelRules: [
      {
        rawText: 'Best before 12 months from date of manufacture',
        base: 'manufacture',
        amount: 12,
        unit: 'months',
        imageIndex: 0,
      },
    ],
    batchNumbers: [
      { labelText: 'BATCH', value: 'HO-2025-OAT', imageIndex: 0, confidence: 0.95 },
    ],
    damage: {
      assessed: true,
      findings: [
        {
          type: 'torn_packaging',
          severity: 'minor',
          evidence: 'Slight outer paper pouch crease on top corner, barrier seal intact.',
          imageIndex: 0,
          box2d: [50, 40, 180, 220],
          confidence: 0.85,
        },
      ],
      limitations: 'Contents cannot be judged from packaging photos alone.',
    },
    imageQuality: [],
    storageInstructions: 'Store in an airtight container in a cool, dry place away from sunlight.',
    customerContact: {
      phone: '1800-DEMO-OATS',
      email: 'care@example.com',
      website: 'https://example.com/demo-food',
    },
    isDemo: true,
    demoScenario: 'food_printed_verified',
  };
}

export function getDemoInvestigationFixture(identity = {}) {
  const brand = (identity.brand || '').toLowerCase();
  const category = (identity.category || '').toLowerCase();

  if (category === 'medicine') {
    return {
      ran: true,
      status: 'DONE',
      isDemo: true,
      queries: [
        'DemoHealth Pharma Demo-Cillin 500mg Capsule prescribing information shelf life storage',
        'DemoHealth Pharma Demo-Cillin expiry date batch number how to read',
      ],
      identityLookup: null,
      sources: [
        {
          id: 's-demo-1',
          url: 'https://example.com/demo/retailer-drugstore',
          title: 'Demo Drugstore Online Pharmacy',
          domain: 'example.com',
          class: 'RETAILER',
          eligible: false,
          reason: 'Retailer pharmacy listing is crowd/vendor maintained; ineligible for medicine shelf-life calculation.',
        },
      ],
      claims: [
        {
          sourceId: 's-demo-1',
          type: 'shelf_life',
          quote: 'Shelf life approximately 2 years when stored properly',
          value: 24,
          unit: 'months',
          accepted: false,
          rejectReason: 'Ineligible source class (RETAILER). Medicines require official manufacturer or regulator monograph.',
        },
      ],
      conclusion: {
        type: 'NONE',
        sourceId: null,
        quote: null,
      },
      creditsUsed: 2,
    };
  }

  // Cosmetic / Food demo investigation with verified claim
  return {
    ran: true,
    status: 'DONE',
    isDemo: true,
    queries: [
      `"${identity.brand || 'DemoBrand'}" "${identity.name || 'Product'}" shelf life unopened`,
      `"${identity.brand || 'DemoBrand'}" expiry date batch number how to read`,
    ],
    identityLookup: {
      provider: 'Open Products Facts (Demo corroboration)',
      found: true,
      name: identity.name || 'Hydra-Glow Vitamin C Serum',
      brand: identity.brand || 'DemoBrand Skin',
      url: 'https://example.com/demo-product-facts',
      note: 'community data, identity only',
    },
    sources: [
      {
        id: 's-demo-mfg',
        url: 'https://example.com/demo/demobrand-official-shelf-life',
        title: 'DemoBrand Official Product FAQ & Shelf Life Guide',
        domain: 'example.com',
        class: 'MANUFACTURER',
        eligible: true,
        reason: 'Verified official manufacturer domain (Demo scenario)',
      },
      {
        id: 's-demo-retailer',
        url: 'https://example.com/demo/beauty-retailer',
        title: 'Demo Marketplace Listing',
        domain: 'example.com',
        class: 'RETAILER',
        eligible: false,
        reason: 'Retailer catalog is third-party reference only.',
      },
    ],
    claims: [
      {
        sourceId: 's-demo-mfg',
        type: 'shelf_life',
        quote: 'unopened shelf life is 24 months from manufacture date',
        value: 24,
        unit: 'months',
        accepted: true,
        rejectReason: null,
      },
    ],
    conclusion: {
      type: 'SHELF_LIFE',
      amount: 24,
      unit: 'months',
      sourceId: 's-demo-mfg',
      quote: 'unopened shelf life is 24 months from manufacture date',
    },
    creditsUsed: 2,
  };
}
