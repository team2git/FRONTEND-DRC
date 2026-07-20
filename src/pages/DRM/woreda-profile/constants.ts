import {
    type WoredaProfile as WProfile,
    type WoredaProfileInput as WProfileInput
} from '../../../api/woredaProfileService';

export const FACILITY_TYPES = ['Health Center', 'School', 'Police Station', 'Fire Station', 'Emergency Shelter'];
export const LIVELIHOOD_TYPES = ['Agriculture', 'Livestock', 'Trade', 'Labor', 'Other'];
export const EDUCATION_CATS = ['No Education', 'Primary', 'Secondary', 'Higher Education', 'Vocational'];
export const VG_TYPES = ['Women-headed HH', 'Persons with Disability (PWD)', 'Elderly living alone', 'Orphans', 'Chronically ill'];
export const CAPACITY_TYPES = ['Kebele DRM Committee', 'Community Volunteers', 'Early Warning System', 'Search & Rescue Team', 'First Aid Team'];

export const STATUS_CONFIG: Record<string, { bg: string; text: string; dot: string; strip: string }> = {
    Submitted: { bg: 'bg-emerald-100', text: 'text-emerald-700', dot: 'bg-emerald-500', strip: 'bg-gradient-to-r from-emerald-400 to-teal-500' },
    Reviewed: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500', strip: 'bg-gradient-to-r from-blue-400 to-indigo-500' },
    Draft: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500', strip: 'bg-gradient-to-r from-amber-400 to-orange-500' },
};

export const statusColor = (s?: string) => {
    const sc = STATUS_CONFIG[s || 'Draft'] || STATUS_CONFIG.Draft;
    return `${sc.bg} ${sc.text} border-transparent`;
};

export const getProfileTitle = (profile: WProfile) => {
    const level = profile.aggregation_level || profile.hierarchy_summary?.aggregation_level || 'household';
    if (level === 'city') return 'City';
    if (level === 'subcity') return `${profile.location.subcity || 'Sub-city'} Sub-city`;
    if (level === 'woreda') return `Woreda ${profile.location.woreda || ''}`.trim();
    if (level === 'block') return `Block-${profile.location.block || ''}`.trim();
    if (level === 'household' && profile.location.house_no) {
        return `House ${profile.location.house_no}`;
    }
    return 'Household';
};

export const getProfileSubtitle = (profile: WProfile) => {
    const level = profile.aggregation_level || profile.hierarchy_summary?.aggregation_level || 'household';
    if (level === 'city') return 'City Level Summary';
    if (level === 'subcity') return `${profile.location.subcity || 'Sub-city'} summary`;
    if (level === 'woreda') return `${profile.location.subcity || 'Sub-city'} • Woreda ${profile.location.woreda || ''}`.trim();
    if (level === 'block') return `${profile.location.subcity || 'Sub-city'} • Woreda ${profile.location.woreda || ''} • Block-${profile.location.block || ''}`.trim();
    if (level === 'household') {
        const blockLabel = profile.location.block !== 'Unknown' && profile.location.block !== 'All Blocks' ? `Block-${profile.location.block} • ` : '';
        return `${blockLabel}Woreda ${profile.location.woreda}`.trim();
    }
    return profile.location.subcity || 'Survey record';
};

export const emptyHouseholdProfile = () => ({
    identity_location: {
        subcity: '',
        woreda: '',
        block: '',
        house_no: '',
        gps_latitude: undefined as number | undefined,
        gps_longitude: undefined as number | undefined,
        enumerator_name: '',
        survey_date: new Date().toISOString().split('T')[0],
        respondent_consent_status: 'Pending' as const
    },
    demographics: {
        total_household_members: 0,
        male_members: 0,
        female_members: 0,
        children_0_17: 0,
        youth_18_29: 0,
        elderly_60_plus: 0,
        female_headed_household: 'No' as const,
        idp_status: 'Unknown' as const,
        idp_reason: '',
        education_level_of_head: '',
        employment_status: ''
    },
    livelihood_economy: {
        primary_livelihood_type: '',
        secondary_livelihood_type: '',
        household_income_level: '',
        small_business_ownership: 'No' as const,
        small_business_type: '',
        daily_labour_dependency: 'No' as const,
        income_disruption_by_disaster: '',
        insurance_coverage: 'No' as const,
        access_to_credit_safety_nets: ''
    },
    housing_physical_conditions: {
        wall_material_type: '',
        roof_material_type: '',
        building_age_years: 0,
        building_code_compliance: '',
        informal_settlement: 'No' as const,
        sleeping_rooms: 0,
        fire_resistant_materials: '',
        proximity_to_hazard_zone: '',
        drainage_water_electricity_access: ''
    },
    preparedness: {
        knows_nearest_emergency_shelter: 'No' as const,
        knows_local_evacuation_route: 'No' as const,
        drm_training_received_type: '',
        family_emergency_plan_exists: 'No' as const,
        emergency_supplies_stockpiled: 'No' as const,
        early_warning_received_channel: '',
        community_awareness_self_rated_1_5: 0
    },
    recovery_capacity: {
        past_disaster_experience_type: '',
        recovery_duration_months: 0,
        self_help_savings_group_membership: 'No' as const,
        government_safety_net_access: 'No' as const,
        income_diversification_2plus_sources: 'No' as const,
        resilience_enumerator_assessment_1_5: 0
    }
});

export const HAZARD_TYPES = [
    'Flood',
    'Landslide',
    'Fire',
    'Earthquake',
    'Disease Outbreak',
    'Drought',
    'Industrial Accident',
    'Road Accident',
    'Building Collapse',
    'Wind Storm',
    'Waterlogging / Urban Flood'
];

export const emptyProfile = (): WProfileInput => ({
    location: { subcity: '', woreda: '', kebele: '', block: '', house_no: '' },
    assessment_date: new Date().toISOString().split('T')[0],
    remarks: '',
    household_profile: emptyHouseholdProfile(),
    survey_metadata: {
        source_type: 'Site Survey',
        source_id: '',
        institution_name: '',
        assessor: '',
        version: '',
        gps_coordinates: '',
        location_reference: '',
        captured_at: new Date().toISOString()
    },
    raw_survey: {
        household_level: { responses: {}, notes: '', captured_at: new Date().toISOString() },
        community_group_discussion: { responses: {}, notes: '', captured_at: new Date().toISOString() },
        key_informant_interview: { responses: {}, notes: '', captured_at: new Date().toISOString() }
    },
    demographics: { total_population: 0, male_population: 0, female_population: 0, children_0_17: 0, youth_18_29: 0, adults_30_59: 0, elderly_60_plus: 0, total_households: 0, female_headed_households: 0, informal_settlement_population: 0, low_income_households: 0, unemployment_rate: 0, internally_displaced_population: 0, education_levels: EDUCATION_CATS.map(c => ({ category: c, count: 0 })) },
    livelihoods: LIVELIHOOD_TYPES.map(t => ({ livelihood_type: t, households: 0, percentage: 0 })),
    basic_services: { water_source: '', electricity: false, road_access: '', drainage_system_coverage: false, solid_waste_management_coverage: false, telecommunications_access: false, critical_lifeline_redundancy: false },
    critical_facilities: FACILITY_TYPES.map(f => ({ facility_type: f, distance_to_nearest_emergency_service: 0, structural_safety: '', emergency_equipment_available: false })),
    vulnerable_groups: VG_TYPES.map(t => ({ group_type: t, number: 0 })),
    community_capacity: CAPACITY_TYPES.map(t => ({ capacity_type: t, available: false, remarks: '' })),
    hazards: HAZARD_TYPES.map(h => ({ hazard_name: h, frequency: '1', severity: '1', duration: '1', spatial_extent: '1', seasonality: '', historical_events: '' })),
    vulnerability_assessments: [],
    capacity_assessments: [],
    risk_assessments: [],
    risk_index: { hazard_index: 0, vulnerability_index: 0, exposure_index: 0, capacity_index: 0, overall_woreda_risk_score: 0 },
    economic_risk_indicators: {
        concentration_small_informal_businesses: '',
        market_exposure: '',
        daily_labor_dependency: '',
        business_interruption_risk: '',
        industrial_hazard_exposure: '',
        insurance_coverage_level: ''
    },
    environmental_indicators: {
        green_space_per_capita: '',
        wetland_encroachment: '',
        soil_sealing_coverage: '',
        waste_dumping_sites: '',
        urban_drainage_blockage_frequency: '',
        pollution_hotspots: ''
    },
    infrastructure_exposure: {
        road_network_status: '',
        health_facility_access: '',
        water_supply_coverage: '',
        sanitation_infrastructure_coverage: '',
        shelter_exposure: ''
    },
    community_voice_interventions: {
        priority_needs: '',
        local_response_capacity: '',
        early_warning_feedback: '',
        suggested_interventions: '',
        social_cohesion_level: ''
    },
    preparedness_indicators: {
        emergency_shelters_availability: '',
        evacuation_routes_mapped: '',
        firefighting_equipment_availability: '',
        ambulance_coverage: '',
        emergency_drills_frequency: '',
        community_awareness_level: '',
        stockpiled_emergency_supplies: ''
    },
    recovery_indicators: {
        post_disaster_recovery_plans: '',
        livelihood_diversification: '',
        access_to_credit_safety_nets: '',
        community_self_help_groups: '',
        urban_upgrading_programs: '',
        climate_adaptation_initiatives: ''
    },
    kii_capacity_indicators: {
        ews: 3, drm_committee: 3, focal_persons: 3, training_freq: 3,
        shelters: 3, community_structures: 3, emergency_services: 3,
        inter_sector_coordination: 3, institutional_strength: 3,
        recovery_plan: 3, budget: 3, drm_mainstreaming: 3
    },
    kii_infrastructure_exposure: {
        health: 3, water: 3, energy: 3, emergency: 3, communications: 3
    },
    kii_environmental_indicators: {
        drainage: 3, green_cover: 3, waste_mgmt: 3, pollution: 3
    },
    cgd_community_voice: {
        coping_strategies: '',
        collective_action_structure: '',
        suggested_interventions: ''
    },
    status: 'Draft',
});

