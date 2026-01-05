module logbook::logbook {
    use sui::vec_map::{Self, VecMap};
    use sui::clock::Clock;
    use std::string::String;

    // Question types
    const QTYPE_SINGLE_CHOICE: u8 = 0;
    const QTYPE_MULTIPLE_CHOICE: u8 = 1;
    const QTYPE_TEXT: u8 = 2;

    // Access types
    const ACCESS_PUBLIC: u8 = 0;
    const ACCESS_WHITELIST: u8 = 1;

    // Error codes
    const EAlreadyParticipated: u64 = 0;
    const EInvalidOption: u64 = 1;
    const ENotWhitelisted: u64 = 2;
    const ECampaignEnded: u64 = 3;
    const ENotCreator: u64 = 4;
    const EInvalidQuestionIndex: u64 = 5;
    const ECampaignNotEnded: u64 = 6;
    const EAlreadyFinalized: u64 = 7;

    // Question structure - stores question data and vote counts
    public struct Question has store, copy, drop {
        question_type: u8,
        text: String,
        required: bool,
        // For choice questions: options text
        options: vector<String>,
        // Vote counts for each option (index matches options)
        option_votes: vector<u64>,
        // For text questions: count of responses
        text_response_count: u64,
    }

    // Response structure - stores user's answers
    public struct Response has store, copy, drop {
        respondent: address,
        timestamp: u64,
        // Answer data per question (question_id -> answer)
        // For single choice: "opt_index" (e.g., "0", "1", "2")
        // For multiple choice: "0,2,3" (comma-separated indices)
        // For text: the actual text response
        answers: VecMap<u64, String>,
    }

    // Campaign structure
    public struct Campaign has key {
        id: UID,
        creator: address,
        title: String,
        description: String,
        questions: vector<Question>,
        responses: vector<Response>,
        participants: VecMap<address, bool>,
        total_responses: u64,
        access_type: u8,
        whitelist: VecMap<address, bool>,
        created_at: u64,
        end_time: u64,  // Unix timestamp in milliseconds
        is_finalized: bool,
    }

    // Registry to track all campaigns by creator
    public struct CampaignRegistry has key {
        id: UID,
        campaigns_by_creator: VecMap<address, vector<ID>>,
        all_campaigns: vector<ID>,
    }

    // Create registry (called once during deployment)
    fun init(ctx: &mut TxContext) {
        let registry = CampaignRegistry {
            id: object::new(ctx),
            campaigns_by_creator: vec_map::empty(),
            all_campaigns: vector::empty(),
        };
        transfer::share_object(registry);
    }

    // Create a new campaign
    public fun create_campaign(
        registry: &mut CampaignRegistry,
        title: String,
        description: String,
        question_types: vector<u8>,
        question_texts: vector<String>,
        question_required: vector<bool>,
        // Options are flattened: [q1_opt1, q1_opt2, q2_opt1, q2_opt2, q2_opt3, ...]
        all_options: vector<String>,
        // Number of options per question: [2, 3, ...] means q1 has 2 options, q2 has 3
        options_per_question: vector<u64>,
        access_type: u8,
        end_time: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let creator = ctx.sender();
        let questions_count = question_types.length();
        let mut questions: vector<Question> = vector::empty();
        let mut option_offset: u64 = 0;

        // Build questions with their options
        let mut i: u64 = 0;
        while (i < questions_count) {
            let q_type = question_types[i];
            let q_text = question_texts[i];
            let q_required = question_required[i];

            let mut options: vector<String> = vector::empty();
            let mut option_votes: vector<u64> = vector::empty();

            // Get options count for this question
            let opts_count = if (i < options_per_question.length()) {
                options_per_question[i]
            } else {
                0
            };

            // Extract options for this question
            let mut j: u64 = 0;
            while (j < opts_count) {
                let opt_idx = option_offset + j;
                if (opt_idx < all_options.length()) {
                    options.push_back(all_options[opt_idx]);
                    option_votes.push_back(0);
                };
                j = j + 1;
            };
            option_offset = option_offset + opts_count;

            let question = Question {
                question_type: q_type,
                text: q_text,
                required: q_required,
                options,
                option_votes,
                text_response_count: 0,
            };
            questions.push_back(question);
            i = i + 1;
        };

        let campaign = Campaign {
            id: object::new(ctx),
            creator,
            title,
            description,
            questions,
            responses: vector::empty(),
            participants: vec_map::empty(),
            total_responses: 0,
            access_type,
            whitelist: vec_map::empty(),
            created_at: clock.timestamp_ms(),
            end_time,
            is_finalized: false,
        };

        let campaign_id = object::id(&campaign);

        // Update registry
        if (registry.campaigns_by_creator.contains(&creator)) {
            let creator_campaigns = registry.campaigns_by_creator.get_mut(&creator);
            creator_campaigns.push_back(campaign_id);
        } else {
            let mut new_list = vector::empty();
            new_list.push_back(campaign_id);
            registry.campaigns_by_creator.insert(creator, new_list);
        };
        registry.all_campaigns.push_back(campaign_id);

        transfer::share_object(campaign);
    }

    // Submit response to a campaign
    public fun submit_response(
        campaign: &mut Campaign,
        // Answers are provided as: question_indices and corresponding answer strings
        question_indices: vector<u64>,
        answers: vector<String>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let respondent = ctx.sender();
        let current_time = clock.timestamp_ms();

        // Check campaign hasn't ended
        assert!(current_time < campaign.end_time, ECampaignEnded);

        // Check not already participated
        assert!(!campaign.participants.contains(&respondent), EAlreadyParticipated);

        // Check whitelist if required
        if (campaign.access_type == ACCESS_WHITELIST) {
            assert!(campaign.whitelist.contains(&respondent), ENotWhitelisted);
        };

        // Process answers and update vote counts
        let mut answer_map: VecMap<u64, String> = vec_map::empty();
        let answers_count = question_indices.length();

        let mut i: u64 = 0;
        while (i < answers_count) {
            let q_idx = question_indices[i];
            let answer = answers[i];

            assert!(q_idx < campaign.questions.length(), EInvalidQuestionIndex);

            // Update vote counts based on question type
            let question = &mut campaign.questions[q_idx];

            if (question.question_type == QTYPE_SINGLE_CHOICE) {
                // Parse option index and increment vote
                let opt_idx = parse_u64(&answer);
                if (opt_idx < question.option_votes.length()) {
                    let vote_count = &mut question.option_votes[opt_idx];
                    *vote_count = *vote_count + 1;
                };
            } else if (question.question_type == QTYPE_MULTIPLE_CHOICE) {
                // Parse comma-separated indices
                let indices = parse_multiple_indices(&answer);
                let mut j: u64 = 0;
                while (j < indices.length()) {
                    let idx = indices[j];
                    if (idx < question.option_votes.length()) {
                        let vote_count = &mut question.option_votes[idx];
                        *vote_count = *vote_count + 1;
                    };
                    j = j + 1;
                };
            } else if (question.question_type == QTYPE_TEXT) {
                question.text_response_count = question.text_response_count + 1;
            };

            answer_map.insert(q_idx, answer);
            i = i + 1;
        };

        // Create and store response
        let response = Response {
            respondent,
            timestamp: current_time,
            answers: answer_map,
        };
        campaign.responses.push_back(response);
        campaign.participants.insert(respondent, true);
        campaign.total_responses = campaign.total_responses + 1;
    }

    // Add address to whitelist (creator only)
    public fun add_to_whitelist(
        campaign: &mut Campaign,
        address_to_add: address,
        ctx: &mut TxContext
    ) {
        assert!(campaign.creator == ctx.sender(), ENotCreator);
        campaign.whitelist.insert(address_to_add, true);
    }

    // Add multiple addresses to whitelist
    public fun add_multiple_to_whitelist(
        campaign: &mut Campaign,
        addresses: vector<address>,
        ctx: &mut TxContext
    ) {
        assert!(campaign.creator == ctx.sender(), ENotCreator);
        let mut i: u64 = 0;
        while (i < addresses.length()) {
            let addr = addresses[i];
            if (!campaign.whitelist.contains(&addr)) {
                campaign.whitelist.insert(addr, true);
            };
            i = i + 1;
        };
    }

    // Finalize campaign (can be called after end_time)
    public fun finalize_campaign(
        campaign: &mut Campaign,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(campaign.creator == ctx.sender(), ENotCreator);
        assert!(clock.timestamp_ms() >= campaign.end_time, ECampaignNotEnded);
        assert!(!campaign.is_finalized, EAlreadyFinalized);

        campaign.is_finalized = true;
    }

    // Helper: Parse u64 from string (simple single number)
    fun parse_u64(s: &String): u64 {
        let bytes = s.as_bytes();
        let mut result: u64 = 0;
        let mut i: u64 = 0;
        while (i < bytes.length()) {
            let b = bytes[i];
            if (b >= 48 && b <= 57) { // '0' to '9'
                result = result * 10 + ((b - 48) as u64);
            } else {
                // Non-digit character, stop parsing
                break
            };
            i = i + 1;
        };
        result
    }

    // Helper: Parse comma-separated indices (e.g., "0,2,3")
    fun parse_multiple_indices(s: &String): vector<u64> {
        let bytes = s.as_bytes();
        let mut result: vector<u64> = vector::empty();
        let mut current: u64 = 0;
        let mut has_digits = false;

        let mut i: u64 = 0;
        while (i < bytes.length()) {
            let b = bytes[i];
            if (b >= 48 && b <= 57) { // '0' to '9'
                current = current * 10 + ((b - 48) as u64);
                has_digits = true;
            } else if (b == 44) { // ','
                if (has_digits) {
                    result.push_back(current);
                    current = 0;
                    has_digits = false;
                };
            };
            i = i + 1;
        };

        // Don't forget the last number
        if (has_digits) {
            result.push_back(current);
        };

        result
    }

    // === Getters ===

    public fun get_creator(campaign: &Campaign): address { campaign.creator }
    public fun get_title(campaign: &Campaign): String { campaign.title }
    public fun get_description(campaign: &Campaign): String { campaign.description }
    public fun get_questions(campaign: &Campaign): vector<Question> { campaign.questions }
    public fun get_total_responses(campaign: &Campaign): u64 { campaign.total_responses }
    public fun get_access_type(campaign: &Campaign): u8 { campaign.access_type }
    public fun get_created_at(campaign: &Campaign): u64 { campaign.created_at }
    public fun get_end_time(campaign: &Campaign): u64 { campaign.end_time }
    public fun get_is_finalized(campaign: &Campaign): bool { campaign.is_finalized }

    public fun has_participated(campaign: &Campaign, addr: address): bool {
        campaign.participants.contains(&addr)
    }

    public fun is_whitelisted(campaign: &Campaign, addr: address): bool {
        campaign.whitelist.contains(&addr)
    }

    // Get question details
    public fun get_question_text(q: &Question): String { q.text }
    public fun get_question_type(q: &Question): u8 { q.question_type }
    public fun get_question_required(q: &Question): bool { q.required }
    public fun get_question_options(q: &Question): vector<String> { q.options }
    public fun get_question_votes(q: &Question): vector<u64> { q.option_votes }
    public fun get_question_text_count(q: &Question): u64 { q.text_response_count }

    // Get responses (for campaign creator)
    public fun get_responses(campaign: &Campaign): vector<Response> { campaign.responses }

    // Response getters
    public fun get_response_respondent(r: &Response): address { r.respondent }
    public fun get_response_timestamp(r: &Response): u64 { r.timestamp }
    public fun get_response_answers(r: &Response): VecMap<u64, String> { r.answers }

    // Registry getters
    public fun get_all_campaigns(registry: &CampaignRegistry): vector<ID> { registry.all_campaigns }
    public fun get_campaigns_by_creator(registry: &CampaignRegistry, creator: address): vector<ID> {
        if (registry.campaigns_by_creator.contains(&creator)) {
            *registry.campaigns_by_creator.get(&creator)
        } else {
            vector::empty()
        }
    }

    // Constants for frontend
    public fun qtype_single_choice(): u8 { QTYPE_SINGLE_CHOICE }
    public fun qtype_multiple_choice(): u8 { QTYPE_MULTIPLE_CHOICE }
    public fun qtype_text(): u8 { QTYPE_TEXT }

    public fun access_public(): u8 { ACCESS_PUBLIC }
    public fun access_whitelist(): u8 { ACCESS_WHITELIST }
}
