module suiforms::suiforms {
    use sui::vec_map::{Self, VecMap};
    use std::string::String;

    // Типы форм
    const TYPE_POLL: u8 = 0;
    const TYPE_VOTE: u8 = 1;
    const TYPE_SURVEY: u8 = 2;
    const TYPE_QUIZ: u8 = 3;

    // Типы доступа
    const ACCESS_PUBLIC: u8 = 0;
    const ACCESS_LINK: u8 = 1;
    const ACCESS_WHITELIST: u8 = 2;

    // Методы аутентификации
    const AUTH_SUI_WALLET: u8 = 1;
    const AUTH_ZKLOGIN: u8 = 2;
    const AUTH_BOTH: u8 = 3;

    // Коды ошибок
    const EAlreadyParticipated: u64 = 0;
    const EInvalidOption: u64 = 1;
    const ENotWhitelisted: u64 = 2;
    const EInvalidAuthMethod: u64 = 3;

    // Универсальная структура Form
    public struct Form has key {
        id: UID,
        form_type: u8,
        creator: address,
        title: String,
        description: String,
        options: vector<String>,
        option_votes: vector<u64>,
        participants: VecMap<address, u64>,
        total_participants: u64,
        access_type: u8,
        auth_method: u8,
        whitelist: VecMap<address, bool>,
        created_at: u64,
    }

    // Создать форму
    public fun create_form(
        title: String,
        description: String,
        options: vector<String>,
        form_type: u8,
        access_type: u8,
        auth_method: u8,
        ctx: &mut TxContext
    ) {
        let options_count = options.length();
        let mut option_votes = vector[];
        let mut i = 0;
        
        while (i < options_count) {
            option_votes.push_back(0);
            i = i + 1;
        };

        let form = Form {
            id: object::new(ctx),
            form_type,
            creator: ctx.sender(),
            title,
            description,
            options,
            option_votes,
            participants: vec_map::empty(),
            total_participants: 0,
            access_type,
            auth_method,
            whitelist: vec_map::empty(),
            created_at: 0,
        };

        transfer::share_object(form);
    }

    // Добавить адрес в whitelist
    public fun add_to_whitelist(
        form: &mut Form,
        address_to_add: address,
        ctx: &mut TxContext
    ) {
        assert!(form.creator == ctx.sender(), EInvalidAuthMethod);
        form.whitelist.insert(address_to_add, true);
    }

    // Ответить на форму
    public fun submit_response(
        form: &mut Form,
        option_index: u64,
        ctx: &mut TxContext
    ) {
        let respondent = ctx.sender();
        
        // Проверка whitelist
        if (form.access_type == ACCESS_WHITELIST) {
            assert!(form.whitelist.contains(&respondent), ENotWhitelisted);
        };
        
        assert!(!form.participants.contains(&respondent), EAlreadyParticipated);
        assert!(option_index < form.options.length(), EInvalidOption);

        let vote_count = &mut form.option_votes[option_index];
        *vote_count = *vote_count + 1;

        form.participants.insert(respondent, option_index);
        form.total_participants = form.total_participants + 1;
    }

    // Геттеры
    public fun get_type(form: &Form): u8 { form.form_type }
    public fun get_creator(form: &Form): address { form.creator }
    public fun get_title(form: &Form): String { form.title }
    public fun get_description(form: &Form): String { form.description }
    public fun get_options(form: &Form): vector<String> { form.options }
    public fun get_votes(form: &Form): vector<u64> { form.option_votes }
    public fun get_total_participants(form: &Form): u64 { form.total_participants }
    public fun get_access_type(form: &Form): u8 { form.access_type }
    public fun get_auth_method(form: &Form): u8 { form.auth_method }
    
    public fun has_participated(form: &Form, addr: address): bool {
        form.participants.contains(&addr)
    }
    
    public fun get_user_response(form: &Form, addr: address): u64 {
        *form.participants.get(&addr)
    }

    public fun is_whitelisted(form: &Form, addr: address): bool {
        form.whitelist.contains(&addr)
    }

    // Константы для фронтенда
    public fun type_poll(): u8 { TYPE_POLL }
    public fun type_vote(): u8 { TYPE_VOTE }
    public fun type_survey(): u8 { TYPE_SURVEY }
    public fun type_quiz(): u8 { TYPE_QUIZ }
    
    public fun access_public(): u8 { ACCESS_PUBLIC }
    public fun access_link(): u8 { ACCESS_LINK }
    public fun access_whitelist(): u8 { ACCESS_WHITELIST }
    
    public fun auth_sui_wallet(): u8 { AUTH_SUI_WALLET }
    public fun auth_zklogin(): u8 { AUTH_ZKLOGIN }
    public fun auth_both(): u8 { AUTH_BOTH }
}
