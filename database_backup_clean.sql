SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;
SET default_tablespace = '';
SET default_table_access_method = heap;
CREATE TABLE public.account_lockouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    lockout_type character varying(20) NOT NULL,
    locked_at timestamp without time zone DEFAULT now() NOT NULL,
    locked_until timestamp without time zone,
    unlocked_at timestamp without time zone,
    unlocked_by character varying,
    reason text,
    attempt_count integer DEFAULT 0 NOT NULL
);
ALTER TABLE public.account_lockouts OWNER TO neondb_owner;
CREATE TABLE public.active_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    session_id character varying(255) NOT NULL,
    ip_address character varying(45),
    user_agent text,
    device_type character varying(50),
    browser character varying(100),
    os character varying(100),
    is_current boolean DEFAULT false,
    last_activity timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.active_sessions OWNER TO neondb_owner;
CREATE TABLE public.ad_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    ad_spot_id uuid NOT NULL,
    showcase_id uuid,
    name character varying(255) NOT NULL,
    creative_url character varying,
    target_url character varying,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    total_cost numeric(10,2) NOT NULL,
    billing_cycle character varying(20) DEFAULT 'prepaid'::character varying,
    impressions integer DEFAULT 0,
    clicks integer DEFAULT 0,
    conversions integer DEFAULT 0,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    is_paid boolean DEFAULT false,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.ad_campaigns OWNER TO neondb_owner;
CREATE TABLE public.ad_impressions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid NOT NULL,
    user_id character varying,
    ip_address character varying(45),
    user_agent text,
    referrer character varying(500),
    is_click boolean DEFAULT false,
    is_conversion boolean DEFAULT false,
    "timestamp" timestamp without time zone DEFAULT now()
);
ALTER TABLE public.ad_impressions OWNER TO neondb_owner;
CREATE TABLE public.ad_spots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    display_name character varying(100) NOT NULL,
    description text,
    location character varying(50) NOT NULL,
    "position" character varying(50),
    price_per_day numeric(10,2),
    price_per_week numeric(10,2),
    price_per_month numeric(10,2),
    dimensions character varying(50),
    max_active_slots integer DEFAULT 1,
    is_available boolean DEFAULT true,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.ad_spots OWNER TO neondb_owner;
CREATE TABLE public.admin_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_id character varying NOT NULL,
    action character varying(100) NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying(255) NOT NULL,
    changes jsonb,
    reason text,
    ip_address character varying(45),
    user_agent text,
    session_id character varying(255),
    status character varying(20) DEFAULT 'success'::character varying,
    error_message text,
    metadata jsonb,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.admin_audit_logs OWNER TO neondb_owner;
CREATE TABLE public.admin_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    permissions jsonb NOT NULL,
    is_system_role boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.admin_roles OWNER TO neondb_owner;
CREATE TABLE public.ai_content_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    name character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    category character varying(100),
    prompt text NOT NULL,
    variables jsonb,
    examples jsonb,
    tone character varying(30),
    platform character varying(30),
    is_global boolean DEFAULT false,
    is_active boolean DEFAULT true,
    usage_count integer DEFAULT 0,
    rating numeric(3,2) DEFAULT '0'::numeric,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.ai_content_templates OWNER TO neondb_owner;
CREATE TABLE public.ai_content_tests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'running'::character varying,
    variants jsonb,
    winner_variant_id character varying(50),
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    metrics jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.ai_content_tests OWNER TO neondb_owner;
CREATE TABLE public.ai_generated_content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    user_id character varying,
    type character varying(50) NOT NULL,
    platform character varying(30),
    content text NOT NULL,
    prompt text,
    enhanced_prompt text,
    tone character varying(30),
    language character varying(10) DEFAULT 'en'::character varying,
    keywords jsonb,
    hashtags jsonb,
    metadata jsonb,
    quality_metrics jsonb,
    version integer DEFAULT 1,
    parent_id uuid,
    is_favorite boolean DEFAULT false,
    is_template boolean DEFAULT false,
    template_name character varying(255),
    usage_count integer DEFAULT 0,
    performance_metrics jsonb,
    status character varying(20) DEFAULT 'draft'::character varying,
    published_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.ai_generated_content OWNER TO neondb_owner;
CREATE TABLE public.ai_generated_images (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    user_id character varying,
    prompt text NOT NULL,
    enhanced_prompt text,
    negative_prompt text,
    url text NOT NULL,
    local_path text,
    s3_url text,
    metadata jsonb,
    category character varying(50),
    tags jsonb,
    variations jsonb,
    is_favorite boolean DEFAULT false,
    usage_count integer DEFAULT 0,
    status character varying(20) DEFAULT 'active'::character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.ai_generated_images OWNER TO neondb_owner;
CREATE TABLE public.ai_moderation_log (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    content_id uuid,
    content_type character varying(50) NOT NULL,
    business_id uuid,
    moderation_result jsonb,
    flagged_reasons jsonb,
    is_safe boolean DEFAULT true,
    action character varying(30),
    moderated_by character varying,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.ai_moderation_log OWNER TO neondb_owner;
CREATE TABLE public.ai_usage_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id character varying,
    service character varying(30) NOT NULL,
    model character varying(50) NOT NULL,
    type character varying(50) NOT NULL,
    tokens_used integer DEFAULT 0,
    cost numeric(10,6) NOT NULL,
    metadata jsonb,
    billing_period character varying(20),
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.ai_usage_tracking OWNER TO neondb_owner;
CREATE TABLE public.analytics_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type character varying(100) NOT NULL,
    event_category character varying(100),
    user_id character varying,
    business_id uuid,
    product_id uuid,
    order_id uuid,
    session_id character varying(255),
    ip_address character varying(45),
    user_agent text,
    event_data jsonb,
    "timestamp" timestamp without time zone DEFAULT now() NOT NULL,
    processing_time integer,
    metadata jsonb
);
ALTER TABLE public.analytics_events OWNER TO neondb_owner;
CREATE TABLE public.api_keys (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key_hash character varying(64) NOT NULL,
    name character varying(255) NOT NULL,
    business_id uuid NOT NULL,
    user_id character varying NOT NULL,
    permissions jsonb DEFAULT '[]'::jsonb NOT NULL,
    rate_limit jsonb,
    is_active boolean DEFAULT true,
    last_used_at timestamp without time zone,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.api_keys OWNER TO neondb_owner;
CREATE TABLE public.auth_audit_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    event_type character varying(50) NOT NULL,
    event_status character varying(20) NOT NULL,
    ip_address character varying(45),
    user_agent text,
    session_id character varying(255),
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.auth_audit_logs OWNER TO neondb_owner;
CREATE TABLE public.blog_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id character varying,
    session_id character varying(64),
    view_type character varying(20) DEFAULT 'page_view'::character varying NOT NULL,
    scroll_depth integer,
    time_spent_seconds integer,
    referrer character varying(500),
    utm_source character varying(100),
    utm_medium character varying(100),
    utm_campaign character varying(100),
    device_type character varying(20),
    browser character varying(50),
    os character varying(50),
    country character varying(2),
    city character varying(100),
    viewed_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.blog_analytics OWNER TO neondb_owner;
CREATE TABLE public.blog_bookmarks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id character varying NOT NULL,
    reading_list_id uuid,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.blog_bookmarks OWNER TO neondb_owner;
CREATE TABLE public.blog_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(100) NOT NULL,
    description text,
    color character varying(7),
    icon character varying(50),
    post_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.blog_categories OWNER TO neondb_owner;
CREATE TABLE public.blog_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    author_id character varying NOT NULL,
    parent_comment_id uuid,
    content text NOT NULL,
    is_edited boolean DEFAULT false,
    edited_at timestamp without time zone,
    like_count integer DEFAULT 0,
    reply_count integer DEFAULT 0,
    is_approved boolean DEFAULT true,
    is_flagged boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.blog_comments OWNER TO neondb_owner;
CREATE TABLE public.blog_post_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.blog_post_tags OWNER TO neondb_owner;
CREATE TABLE public.blog_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    author_id character varying NOT NULL,
    business_id uuid,
    title character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    excerpt character varying(500),
    content text NOT NULL,
    featured_image_url character varying,
    category_id uuid,
    meta_title character varying(60),
    meta_description character varying(160),
    meta_keywords jsonb,
    canonical_url character varying(500),
    og_image character varying,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    published_at timestamp without time zone,
    scheduled_at timestamp without time zone,
    view_count integer DEFAULT 0,
    unique_view_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    share_count integer DEFAULT 0,
    bookmark_count integer DEFAULT 0,
    read_completion_rate numeric(5,2) DEFAULT '0'::numeric,
    avg_read_time_seconds integer,
    is_featured boolean DEFAULT false,
    is_pinned boolean DEFAULT false,
    allow_comments boolean DEFAULT true,
    version integer DEFAULT 1,
    last_edited_by character varying,
    last_edited_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.blog_posts OWNER TO neondb_owner;
CREATE TABLE public.blog_reactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id character varying NOT NULL,
    reaction_type character varying(20) DEFAULT 'like'::character varying NOT NULL,
    count integer DEFAULT 1,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.blog_reactions OWNER TO neondb_owner;
CREATE TABLE public.blog_reading_lists (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_public boolean DEFAULT false,
    bookmark_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.blog_reading_lists OWNER TO neondb_owner;
CREATE TABLE public.blog_revisions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    version integer NOT NULL,
    edited_by character varying NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    excerpt character varying(500),
    changes_summary text,
    change_type character varying(20) DEFAULT 'edit'::character varying,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.blog_revisions OWNER TO neondb_owner;
CREATE TABLE public.blog_subscriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    email character varying(255) NOT NULL,
    subscribed_to_all boolean DEFAULT true,
    subscribed_categories jsonb,
    subscribed_authors jsonb,
    frequency character varying(20) DEFAULT 'instant'::character varying,
    is_active boolean DEFAULT true,
    unsubscribe_token character varying(64),
    confirmed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.blog_subscriptions OWNER TO neondb_owner;
CREATE TABLE public.blog_tags (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    slug character varying(50) NOT NULL,
    post_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.blog_tags OWNER TO neondb_owner;
CREATE TABLE public.business_followers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.business_followers OWNER TO neondb_owner;
CREATE TABLE public.business_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    date timestamp without time zone NOT NULL,
    views integer DEFAULT 0,
    unique_visitors integer DEFAULT 0,
    clicks integer DEFAULT 0,
    revenue numeric(12,2) DEFAULT '0'::numeric,
    orders integer DEFAULT 0,
    products_listed_count integer DEFAULT 0,
    products_sold_count integer DEFAULT 0,
    new_customers integer DEFAULT 0,
    returning_customers integer DEFAULT 0,
    average_order_value numeric(12,2) DEFAULT '0'::numeric,
    reviews_received integer DEFAULT 0,
    average_rating numeric(3,2) DEFAULT '0'::numeric,
    messages_received integer DEFAULT 0,
    messages_replied integer DEFAULT 0,
    spotlight_votes integer DEFAULT 0,
    spotlight_wins integer DEFAULT 0,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.business_metrics OWNER TO neondb_owner;
CREATE TABLE public.businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    owner_id character varying NOT NULL,
    name character varying(255) NOT NULL,
    tagline character varying(500),
    description text,
    category character varying(100),
    location character varying(255),
    address text,
    phone character varying(20),
    website character varying(255),
    logo_url character varying,
    cover_image_url character varying,
    operating_hours jsonb,
    social_links jsonb,
    google_place_id character varying,
    is_verified boolean DEFAULT false,
    is_active boolean DEFAULT true,
    gmb_verified boolean DEFAULT false,
    gmb_connected boolean DEFAULT false,
    gmb_account_id character varying,
    gmb_location_id character varying,
    gmb_sync_status character varying(20) DEFAULT 'none'::character varying,
    gmb_last_sync_at timestamp without time zone,
    gmb_last_error_at timestamp without time zone,
    gmb_last_error text,
    gmb_data_sources jsonb,
    stripe_account_id text,
    stripe_onboarding_status text,
    stripe_charges_enabled boolean DEFAULT false,
    stripe_payouts_enabled boolean DEFAULT false,
    payment_integrations jsonb,
    mini_store_enabled boolean DEFAULT false,
    mini_store_config jsonb,
    rating numeric(3,2) DEFAULT '0'::numeric,
    review_count integer DEFAULT 0,
    follower_count integer DEFAULT 0,
    post_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.businesses OWNER TO neondb_owner;
CREATE TABLE public.campaign_clicks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    link_id uuid NOT NULL,
    clicked_at timestamp without time zone DEFAULT now(),
    ip_address character varying(45),
    user_agent text,
    device_type character varying(50),
    browser character varying(100),
    os character varying(100),
    country character varying(100),
    city character varying(100)
);
ALTER TABLE public.campaign_clicks OWNER TO neondb_owner;
CREATE TABLE public.campaign_links (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid NOT NULL,
    original_url text NOT NULL,
    short_code character varying(20) NOT NULL,
    tracking_url text NOT NULL,
    click_count integer DEFAULT 0,
    unique_click_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.campaign_links OWNER TO neondb_owner;
CREATE TABLE public.campaign_recipients (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    campaign_id uuid NOT NULL,
    user_id character varying,
    email character varying(255),
    phone character varying(20),
    first_name character varying(100),
    last_name character varying(100),
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    sent_at timestamp without time zone,
    delivered_at timestamp without time zone,
    opened_at timestamp without time zone,
    first_clicked_at timestamp without time zone,
    bounced_at timestamp without time zone,
    open_count integer DEFAULT 0,
    click_count integer DEFAULT 0,
    last_opened_at timestamp without time zone,
    last_clicked_at timestamp without time zone,
    error_message text,
    bounce_type character varying(50),
    external_message_id character varying(255),
    external_status character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.campaign_recipients OWNER TO neondb_owner;
CREATE TABLE public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    product_id uuid NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    added_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.cart_items OWNER TO neondb_owner;
CREATE TABLE public.chat_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    duration integer NOT NULL,
    message_count integer NOT NULL,
    user_message_count integer NOT NULL,
    assistant_message_count integer NOT NULL,
    avg_response_time integer,
    min_response_time integer,
    max_response_time integer,
    total_tokens integer,
    total_cost numeric(10,4),
    models_used jsonb,
    sentiment_progression jsonb,
    intent_changes integer,
    kb_hit_rate numeric(5,2),
    resolved boolean NOT NULL,
    escalated boolean NOT NULL,
    satisfaction_score integer,
    conversion_event character varying(100),
    conversion_value numeric(10,2),
    peak_hour integer,
    day_of_week integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.chat_analytics OWNER TO neondb_owner;
CREATE TABLE public.chat_conversations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    session_id character varying(100) NOT NULL,
    title character varying(255),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    channel character varying(50) DEFAULT 'widget'::character varying NOT NULL,
    business_id uuid,
    metadata jsonb,
    tags jsonb DEFAULT '[]'::jsonb,
    intent character varying(50),
    sentiment character varying(20),
    language character varying(10) DEFAULT 'en'::character varying,
    message_count integer DEFAULT 0,
    satisfaction_score integer,
    satisfaction_comment text,
    resolved boolean DEFAULT false,
    resolved_at timestamp without time zone,
    resolution_time integer,
    escalated boolean DEFAULT false,
    escalated_at timestamp without time zone,
    escalated_to character varying,
    escalation_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    last_message_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.chat_conversations OWNER TO neondb_owner;
CREATE TABLE public.chat_knowledge_base (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category character varying(100) NOT NULL,
    subcategory character varying(100),
    question text NOT NULL,
    answer text NOT NULL,
    alternative_questions jsonb,
    keywords jsonb,
    title character varying(255),
    slug character varying(255),
    summary text,
    related_articles jsonb,
    external_links jsonb,
    embedding text,
    embedding_model character varying(50),
    view_count integer DEFAULT 0,
    use_count integer DEFAULT 0,
    helpful_count integer DEFAULT 0,
    not_helpful_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    priority integer DEFAULT 0,
    created_by character varying,
    last_edited_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.chat_knowledge_base OWNER TO neondb_owner;
CREATE TABLE public.chat_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    conversation_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    content text NOT NULL,
    message_type character varying(50) DEFAULT 'text'::character varying,
    attachments jsonb,
    metadata jsonb,
    model character varying(50),
    tokens integer,
    latency integer,
    temperature numeric(3,2),
    intent character varying(50),
    sentiment character varying(20),
    entities jsonb,
    knowledge_base_used boolean DEFAULT false,
    knowledge_base_articles jsonb,
    helpful boolean,
    feedback_comment text,
    flagged boolean DEFAULT false,
    flag_reason text,
    status character varying(20) DEFAULT 'sent'::character varying,
    error_message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    read_at timestamp without time zone
);
ALTER TABLE public.chat_messages OWNER TO neondb_owner;
CREATE TABLE public.chat_proactive_triggers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    trigger_type character varying(50) NOT NULL,
    conditions jsonb NOT NULL,
    message text NOT NULL,
    quick_replies jsonb,
    target_pages jsonb,
    requires_auth boolean DEFAULT false,
    exclude_if_conversation_exists boolean DEFAULT true,
    max_shows_per_session integer DEFAULT 1,
    cooldown_minutes integer DEFAULT 60,
    show_count integer DEFAULT 0,
    engagement_count integer DEFAULT 0,
    engagement_rate numeric(5,2),
    priority integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.chat_proactive_triggers OWNER TO neondb_owner;
CREATE TABLE public.chat_quick_actions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    label character varying(100) NOT NULL,
    action_type character varying(50) NOT NULL,
    action_payload jsonb NOT NULL,
    icon character varying(50),
    variant character varying(20) DEFAULT 'default'::character varying,
    description text,
    show_on_pages jsonb,
    show_for_intents jsonb,
    requires_auth boolean DEFAULT false,
    click_count integer DEFAULT 0,
    conversion_count integer DEFAULT 0,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.chat_quick_actions OWNER TO neondb_owner;
CREATE TABLE public.chat_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id character varying(100) NOT NULL,
    user_id character varying,
    device_info jsonb,
    ip_address character varying(45),
    user_agent text,
    location jsonb,
    initial_page character varying(500),
    referrer character varying(500),
    utm_params jsonb,
    page_views jsonb,
    last_activity timestamp without time zone DEFAULT now() NOT NULL,
    is_active boolean DEFAULT true,
    conversation_count integer DEFAULT 0,
    messages_sent integer DEFAULT 0,
    avg_response_time integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone
);
ALTER TABLE public.chat_sessions OWNER TO neondb_owner;
CREATE TABLE public.conversion_funnels (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    funnel_name character varying(100) NOT NULL,
    date timestamp without time zone NOT NULL,
    step1_count integer DEFAULT 0,
    step2_count integer DEFAULT 0,
    step3_count integer DEFAULT 0,
    step4_count integer DEFAULT 0,
    step5_count integer DEFAULT 0,
    step1_to_step2_rate numeric(5,2) DEFAULT '0'::numeric,
    step2_to_step3_rate numeric(5,2) DEFAULT '0'::numeric,
    step3_to_step4_rate numeric(5,2) DEFAULT '0'::numeric,
    step4_to_step5_rate numeric(5,2) DEFAULT '0'::numeric,
    overall_conversion_rate numeric(5,2) DEFAULT '0'::numeric,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.conversion_funnels OWNER TO neondb_owner;
CREATE TABLE public.customer_cohorts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cohort_name character varying(100) NOT NULL,
    cohort_type character varying(50) NOT NULL,
    cohort_date timestamp without time zone NOT NULL,
    user_count integer DEFAULT 0,
    active_users integer DEFAULT 0,
    retention_rate numeric(5,2) DEFAULT '0'::numeric,
    total_revenue numeric(12,2) DEFAULT '0'::numeric,
    average_revenue_per_user numeric(12,2) DEFAULT '0'::numeric,
    average_orders_per_user numeric(8,2) DEFAULT '0'::numeric,
    average_lifetime_value numeric(12,2) DEFAULT '0'::numeric,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.customer_cohorts OWNER TO neondb_owner;
CREATE TABLE public.customer_segments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    criteria jsonb NOT NULL,
    member_count integer DEFAULT 0,
    auto_update boolean DEFAULT true,
    last_calculated_at timestamp without time zone,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.customer_segments OWNER TO neondb_owner;
CREATE TABLE public.daily_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    date timestamp without time zone NOT NULL,
    total_revenue numeric(12,2) DEFAULT '0'::numeric,
    order_count integer DEFAULT 0,
    average_order_value numeric(12,2) DEFAULT '0'::numeric,
    new_users integer DEFAULT 0,
    active_users integer DEFAULT 0,
    returning_users integer DEFAULT 0,
    new_businesses integer DEFAULT 0,
    active_businesses integer DEFAULT 0,
    products_listed integer DEFAULT 0,
    products_sold integer DEFAULT 0,
    points_earned integer DEFAULT 0,
    points_redeemed integer DEFAULT 0,
    rewards_redeemed integer DEFAULT 0,
    reviews_created integer DEFAULT 0,
    messages_exchanged integer DEFAULT 0,
    social_shares integer DEFAULT 0,
    referrals_sent integer DEFAULT 0,
    referrals_completed integer DEFAULT 0,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.daily_metrics OWNER TO neondb_owner;
CREATE TABLE public.device_fingerprints (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    fingerprint character varying(255) NOT NULL,
    device_name character varying(255),
    device_type character varying(50),
    os character varying(100),
    browser character varying(100),
    browser_version character varying(50),
    screen_resolution character varying(50),
    trusted boolean DEFAULT false,
    last_seen timestamp without time zone DEFAULT now() NOT NULL,
    ip_address character varying(45),
    location jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.device_fingerprints OWNER TO neondb_owner;
CREATE TABLE public.engagement_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    followers_growth integer DEFAULT 0,
    posts_engagement numeric(5,2) DEFAULT '0'::numeric,
    recent_activity integer DEFAULT 0,
    product_views integer DEFAULT 0,
    profile_views integer DEFAULT 0,
    order_count integer DEFAULT 0,
    last_featured_daily timestamp without time zone,
    last_featured_weekly timestamp without time zone,
    last_featured_monthly timestamp without time zone,
    calculated_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.engagement_metrics OWNER TO neondb_owner;
CREATE TABLE public.entrepreneur_businesses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entrepreneur_id uuid NOT NULL,
    business_id uuid NOT NULL,
    role character varying(50) DEFAULT 'founder'::character varying NOT NULL,
    equity_percentage numeric(5,2),
    joined_date timestamp without time zone DEFAULT now(),
    left_date timestamp without time zone,
    is_current boolean DEFAULT true,
    is_public boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.entrepreneur_businesses OWNER TO neondb_owner;
CREATE TABLE public.entrepreneurs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    bio text,
    story text,
    tagline character varying(200),
    profile_image_url character varying,
    cover_image_url character varying,
    social_links jsonb,
    achievements jsonb,
    specialties jsonb,
    location character varying(255),
    website character varying(255),
    years_experience integer,
    total_businesses_owned integer DEFAULT 0,
    total_revenue_generated numeric(12,2),
    follower_count integer DEFAULT 0,
    showcase_count integer DEFAULT 0,
    is_verified boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.entrepreneurs OWNER TO neondb_owner;
CREATE TABLE public.error_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    error_hash character varying(64) NOT NULL,
    message text NOT NULL,
    stack text,
    category character varying(50) NOT NULL,
    severity character varying(20) NOT NULL,
    user_id character varying,
    request_path character varying(500),
    request_method character varying(10),
    ip_address character varying(45),
    user_agent text,
    count integer DEFAULT 1,
    first_seen_at timestamp without time zone DEFAULT now() NOT NULL,
    last_seen_at timestamp without time zone DEFAULT now() NOT NULL,
    resolved boolean DEFAULT false,
    resolved_by character varying,
    resolved_at timestamp without time zone,
    notes text
);
ALTER TABLE public.error_logs OWNER TO neondb_owner;
CREATE TABLE public.failed_login_attempts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255) NOT NULL,
    ip_address character varying(45) NOT NULL,
    user_agent text,
    failure_reason character varying(100),
    attempt_time timestamp without time zone DEFAULT now() NOT NULL,
    geo_location jsonb
);
ALTER TABLE public.failed_login_attempts OWNER TO neondb_owner;
CREATE TABLE public.geo_restrictions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    country_code character varying(2) NOT NULL,
    region_code character varying(10),
    restriction_type character varying(10) NOT NULL,
    reason text,
    is_active boolean DEFAULT true,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.geo_restrictions OWNER TO neondb_owner;
CREATE TABLE public.gmb_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    gmb_review_id character varying NOT NULL,
    reviewer_name character varying(255),
    reviewer_photo_url character varying,
    rating integer NOT NULL,
    comment text,
    review_time timestamp without time zone NOT NULL,
    reply_comment text,
    reply_time timestamp without time zone,
    gmb_create_time timestamp without time zone NOT NULL,
    gmb_update_time timestamp without time zone NOT NULL,
    is_visible boolean DEFAULT true,
    imported_at timestamp without time zone DEFAULT now(),
    last_synced_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.gmb_reviews OWNER TO neondb_owner;
CREATE TABLE public.gmb_sync_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    sync_type character varying(30) NOT NULL,
    status character varying(20) NOT NULL,
    data_types jsonb,
    changes jsonb,
    error_details text,
    items_processed integer DEFAULT 0,
    items_updated integer DEFAULT 0,
    items_errors integer DEFAULT 0,
    duration_ms integer,
    triggered_by character varying(20) DEFAULT 'manual'::character varying,
    gmb_api_version character varying(10),
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.gmb_sync_history OWNER TO neondb_owner;
CREATE TABLE public.gmb_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id character varying NOT NULL,
    access_token text NOT NULL,
    refresh_token text NOT NULL,
    token_type character varying(20) DEFAULT 'Bearer'::character varying,
    expires_at timestamp without time zone NOT NULL,
    scope text,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.gmb_tokens OWNER TO neondb_owner;
CREATE TABLE public.ip_access_control (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ip_address character varying(45) NOT NULL,
    ip_range character varying(100),
    access_type character varying(10) NOT NULL,
    reason text,
    expires_at timestamp without time zone,
    is_active boolean DEFAULT true,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.ip_access_control OWNER TO neondb_owner;
CREATE TABLE public.lead_capture_forms (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    fields jsonb NOT NULL,
    success_message text DEFAULT 'Thank you for your submission!'::text NOT NULL,
    redirect_url character varying(500),
    add_to_segment_id uuid,
    enroll_in_workflow_id uuid,
    submission_count integer DEFAULT 0,
    conversion_rate numeric(5,2),
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.lead_capture_forms OWNER TO neondb_owner;
CREATE TABLE public.lead_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_id uuid NOT NULL,
    business_id uuid NOT NULL,
    user_id character varying,
    form_data jsonb NOT NULL,
    email character varying(255),
    phone character varying(20),
    ip_address character varying(45),
    user_agent text,
    referrer text,
    utm_source character varying(100),
    utm_medium character varying(100),
    utm_campaign character varying(100),
    status character varying(20) DEFAULT 'new'::character varying NOT NULL,
    submitted_at timestamp without time zone DEFAULT now(),
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.lead_submissions OWNER TO neondb_owner;
CREATE TABLE public.loyalty_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    current_points integer DEFAULT 0 NOT NULL,
    lifetime_points integer DEFAULT 0 NOT NULL,
    tier_id uuid,
    tier_name character varying(50) DEFAULT 'Bronze'::character varying,
    tier_level integer DEFAULT 1,
    enrolled_at timestamp without time zone DEFAULT now(),
    last_activity_at timestamp without time zone DEFAULT now(),
    points_expiring_next_30_days integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.loyalty_accounts OWNER TO neondb_owner;
CREATE TABLE public.loyalty_rules (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    event_type character varying(100) NOT NULL,
    points_awarded integer NOT NULL,
    calculation_type character varying(50) DEFAULT 'fixed'::character varying,
    calculation_value numeric(10,2),
    min_amount numeric(10,2),
    max_points integer,
    tier_multipliers jsonb,
    is_active boolean DEFAULT true,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.loyalty_rules OWNER TO neondb_owner;
CREATE TABLE public.loyalty_tiers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(50) NOT NULL,
    level integer NOT NULL,
    points_required integer NOT NULL,
    benefits jsonb,
    discount_percentage numeric(5,2) DEFAULT '0'::numeric,
    free_shipping_threshold numeric(10,2),
    priority_support boolean DEFAULT false,
    early_access boolean DEFAULT false,
    color character varying(50),
    icon character varying(100),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.loyalty_tiers OWNER TO neondb_owner;
CREATE TABLE public.loyalty_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    account_id uuid NOT NULL,
    type character varying(50) NOT NULL,
    points integer NOT NULL,
    balance_after integer NOT NULL,
    source character varying(100) NOT NULL,
    source_id character varying,
    description text,
    metadata jsonb,
    expires_at timestamp without time zone,
    is_expired boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.loyalty_transactions OWNER TO neondb_owner;
CREATE TABLE public.marketing_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    target_segment_id uuid,
    subject character varying(255),
    preheader_text character varying(150),
    sender_name character varying(100),
    sender_email character varying(255),
    sender_phone character varying(20),
    content text NOT NULL,
    plain_text_content text,
    scheduled_at timestamp without time zone,
    send_at character varying(50) DEFAULT 'immediate'::character varying,
    timezone character varying(50) DEFAULT 'America/New_York'::character varying,
    total_recipients integer DEFAULT 0,
    sent_count integer DEFAULT 0,
    delivered_count integer DEFAULT 0,
    opened_count integer DEFAULT 0,
    clicked_count integer DEFAULT 0,
    bounced_count integer DEFAULT 0,
    unsubscribed_count integer DEFAULT 0,
    spam_count integer DEFAULT 0,
    delivery_rate numeric(5,2),
    open_rate numeric(5,2),
    click_rate numeric(5,2),
    conversion_rate numeric(5,2),
    track_opens boolean DEFAULT true,
    track_clicks boolean DEFAULT true,
    allow_unsubscribe boolean DEFAULT true,
    test_mode boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    sent_at timestamp without time zone,
    completed_at timestamp without time zone
);
ALTER TABLE public.marketing_campaigns OWNER TO neondb_owner;
CREATE TABLE public.marketing_workflows (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    trigger_type character varying(100) NOT NULL,
    trigger_config jsonb,
    steps jsonb NOT NULL,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    total_enrolled integer DEFAULT 0,
    active_enrollments integer DEFAULT 0,
    completed_enrollments integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    activated_at timestamp without time zone
);
ALTER TABLE public.marketing_workflows OWNER TO neondb_owner;
CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    sender_id character varying NOT NULL,
    receiver_id character varying NOT NULL,
    sender_business_id uuid,
    receiver_business_id uuid,
    content text NOT NULL,
    message_type character varying(30) DEFAULT 'text'::character varying NOT NULL,
    file_url character varying,
    file_name character varying,
    file_type character varying(100),
    file_size integer,
    shared_business_id uuid,
    shared_product_id uuid,
    is_read boolean DEFAULT false,
    read_at timestamp without time zone,
    is_delivered boolean DEFAULT false,
    delivered_at timestamp without time zone,
    conversation_id character varying NOT NULL,
    networking_context jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.messages OWNER TO neondb_owner;
CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    product_id uuid NOT NULL,
    product_name character varying(255) NOT NULL,
    product_price numeric(10,2) NOT NULL,
    quantity integer NOT NULL,
    total_price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.order_items OWNER TO neondb_owner;
CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    tax_amount numeric(10,2) DEFAULT '0'::numeric,
    shipping_amount numeric(10,2) DEFAULT '0'::numeric,
    total numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'usd'::character varying NOT NULL,
    shipping_address jsonb,
    billing_address jsonb,
    customer_email character varying,
    customer_phone character varying(20),
    notes text,
    customer_comment character varying(200),
    invoice_number character varying(50),
    vendor_business_id uuid,
    parent_order_id uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.orders OWNER TO neondb_owner;
CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    stripe_payment_intent_id character varying,
    stripe_client_secret character varying,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'usd'::character varying NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    payment_method character varying(50) DEFAULT 'card'::character varying,
    failure_reason text,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.payments OWNER TO neondb_owner;
CREATE TABLE public.post_comments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id character varying NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.post_comments OWNER TO neondb_owner;
CREATE TABLE public.post_likes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid NOT NULL,
    user_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.post_likes OWNER TO neondb_owner;
CREATE TABLE public.posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    content text NOT NULL,
    images jsonb,
    type character varying(50) DEFAULT 'update'::character varying,
    like_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    share_count integer DEFAULT 0,
    is_visible boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.posts OWNER TO neondb_owner;
CREATE TABLE public.premium_ad_slots (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name character varying(255) NOT NULL,
    tagline text,
    image_url character varying(500),
    is_premium boolean DEFAULT false,
    business_id uuid,
    display_order integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone
);
ALTER TABLE public.premium_ad_slots OWNER TO neondb_owner;
CREATE TABLE public.premium_features (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    feature_type character varying(30) NOT NULL,
    showcase_id uuid,
    name character varying(100) NOT NULL,
    description text,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    price numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    is_paid boolean DEFAULT false,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.premium_features OWNER TO neondb_owner;
CREATE TABLE public.product_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid NOT NULL,
    date timestamp without time zone NOT NULL,
    views integer DEFAULT 0,
    unique_viewers integer DEFAULT 0,
    search_appearances integer DEFAULT 0,
    units_sold integer DEFAULT 0,
    revenue numeric(12,2) DEFAULT '0'::numeric,
    orders_count integer DEFAULT 0,
    add_to_cart_count integer DEFAULT 0,
    checkout_count integer DEFAULT 0,
    purchase_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    shares_count integer DEFAULT 0,
    stock_level integer DEFAULT 0,
    restock_count integer DEFAULT 0,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.product_metrics OWNER TO neondb_owner;
CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    price numeric(10,2) NOT NULL,
    original_price numeric(10,2),
    category character varying(100),
    images jsonb,
    inventory integer DEFAULT 0,
    is_active boolean DEFAULT true,
    is_digital boolean DEFAULT false,
    tags jsonb,
    rating numeric(3,2) DEFAULT '0'::numeric,
    review_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.products OWNER TO neondb_owner;
CREATE TABLE public.rate_limit_records (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier character varying(255) NOT NULL,
    limit_type character varying(50) NOT NULL,
    attempts integer DEFAULT 1 NOT NULL,
    window_start timestamp without time zone NOT NULL,
    window_end timestamp without time zone NOT NULL,
    blocked boolean DEFAULT false,
    blocked_until timestamp without time zone,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.rate_limit_records OWNER TO neondb_owner;
CREATE TABLE public.rate_limit_violations (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    identifier character varying(255) NOT NULL,
    ip_address character varying(45),
    user_id character varying,
    endpoint character varying(255) NOT NULL,
    violation_type character varying(50) NOT NULL,
    request_count integer NOT NULL,
    time_window integer NOT NULL,
    penalty character varying(50),
    penalty_duration integer,
    metadata jsonb,
    resolved boolean DEFAULT false,
    resolved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.rate_limit_violations OWNER TO neondb_owner;
CREATE TABLE public.recent_purchases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    customer_name character varying(100) NOT NULL,
    customer_location character varying(100),
    product_name character varying(255) NOT NULL,
    vendor_name character varying(255) NOT NULL,
    vendor_business_id uuid,
    customer_comment character varying(200),
    amount numeric(10,2),
    is_visible boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.recent_purchases OWNER TO neondb_owner;
CREATE TABLE public.referrals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    referrer_id character varying NOT NULL,
    referee_id character varying,
    referral_code character varying(50) NOT NULL,
    email character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying,
    referrer_reward_points integer DEFAULT 0,
    referee_reward_points integer DEFAULT 0,
    referrer_rewarded boolean DEFAULT false,
    referee_rewarded boolean DEFAULT false,
    referee_first_purchase_at timestamp without time zone,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    signed_up_at timestamp without time zone,
    completed_at timestamp without time zone
);
ALTER TABLE public.referrals OWNER TO neondb_owner;
CREATE TABLE public.reward_redemptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    reward_id uuid NOT NULL,
    transaction_id uuid NOT NULL,
    points_spent integer NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    redemption_code character varying(100),
    redeemed_at timestamp without time zone DEFAULT now(),
    fulfilled_at timestamp without time zone,
    expires_at timestamp without time zone,
    order_id uuid,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.reward_redemptions OWNER TO neondb_owner;
CREATE TABLE public.rewards (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid,
    name character varying(255) NOT NULL,
    description text,
    image_url character varying(500),
    points_cost integer NOT NULL,
    reward_type character varying(50) NOT NULL,
    reward_value numeric(10,2),
    discount_type character varying(50),
    discount_amount numeric(10,2),
    product_id uuid,
    category character varying(100),
    terms_conditions text,
    stock_quantity integer,
    max_redemptions_per_user integer,
    valid_from timestamp without time zone,
    valid_until timestamp without time zone,
    is_active boolean DEFAULT true,
    is_featured boolean DEFAULT false,
    tier_restriction integer,
    redemption_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.rewards OWNER TO neondb_owner;
CREATE TABLE public.security_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type character varying(100) NOT NULL,
    severity character varying(20) NOT NULL,
    user_id character varying,
    ip_address character varying(45),
    user_agent text,
    description text NOT NULL,
    metadata jsonb,
    resolved boolean DEFAULT false,
    resolved_at timestamp without time zone,
    resolved_by character varying,
    notification_sent boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.security_events OWNER TO neondb_owner;
CREATE TABLE public.security_notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    recipient_email character varying(255) NOT NULL,
    recipient_phone character varying(20),
    notification_type character varying(50) NOT NULL,
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    priority character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    metadata jsonb,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    attempts integer DEFAULT 0,
    sent_at timestamp without time zone,
    failure_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.security_notifications OWNER TO neondb_owner;
CREATE TABLE public.segment_members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    segment_id uuid NOT NULL,
    user_id character varying NOT NULL,
    added_at timestamp without time zone DEFAULT now(),
    source character varying(100) DEFAULT 'automatic'::character varying
);
ALTER TABLE public.segment_members OWNER TO neondb_owner;
CREATE TABLE public.session_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    user_id character varying NOT NULL,
    event_type character varying(50) NOT NULL,
    ip_address character varying(45),
    user_agent text,
    location jsonb,
    metadata jsonb,
    severity character varying(20) DEFAULT 'info'::character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.session_events OWNER TO neondb_owner;
CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);
ALTER TABLE public.sessions OWNER TO neondb_owner;
CREATE TABLE public.social_accounts (
    id text NOT NULL,
    user_id text NOT NULL,
    business_id uuid,
    platform text NOT NULL,
    account_id text NOT NULL,
    account_name text,
    account_handle text,
    profile_url text,
    profile_image_url text,
    is_active boolean DEFAULT true,
    metadata jsonb,
    last_synced_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_accounts OWNER TO neondb_owner;
CREATE TABLE public.social_analytics (
    id text NOT NULL,
    social_account_id text NOT NULL,
    business_id uuid,
    platform text NOT NULL,
    date date NOT NULL,
    metrics jsonb NOT NULL,
    insights jsonb,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_analytics OWNER TO neondb_owner;
CREATE TABLE public.social_content_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    color character varying(7),
    icon character varying(50),
    description text,
    post_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_content_categories OWNER TO neondb_owner;
CREATE TABLE public.social_media_accounts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id character varying NOT NULL,
    platform character varying(30) NOT NULL,
    account_type character varying(30) DEFAULT 'business'::character varying,
    account_id character varying(255) NOT NULL,
    account_name character varying(255),
    account_handle character varying(255),
    profile_url character varying,
    profile_image_url character varying,
    access_token text,
    refresh_token text,
    token_expiry timestamp without time zone,
    token_scopes jsonb,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    last_sync_at timestamp without time zone,
    last_error_at timestamp without time zone,
    last_error text,
    platform_metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_media_accounts OWNER TO neondb_owner;
CREATE TABLE public.social_media_analytics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    post_id uuid,
    account_id uuid,
    business_id uuid NOT NULL,
    platform character varying(30) NOT NULL,
    metric_date date NOT NULL,
    metric_type character varying(30) DEFAULT 'post'::character varying,
    impressions integer DEFAULT 0,
    reach integer DEFAULT 0,
    engagements integer DEFAULT 0,
    likes integer DEFAULT 0,
    comments integer DEFAULT 0,
    shares integer DEFAULT 0,
    saves integer DEFAULT 0,
    clicks integer DEFAULT 0,
    video_views integer DEFAULT 0,
    video_completions integer DEFAULT 0,
    follower_count integer,
    follower_growth integer,
    audience_demographics jsonb,
    engagement_rate numeric(5,2),
    click_through_rate numeric(5,2),
    conversion_rate numeric(5,2),
    cost_per_engagement numeric(10,2),
    conversions integer DEFAULT 0,
    revenue numeric(10,2),
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_media_analytics OWNER TO neondb_owner;
CREATE TABLE public.social_media_automation (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(50) NOT NULL,
    trigger_type character varying(50),
    trigger_config jsonb,
    action_type character varying(50),
    action_config jsonb,
    platforms jsonb,
    is_active boolean DEFAULT true,
    last_triggered_at timestamp without time zone,
    trigger_count integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_media_automation OWNER TO neondb_owner;
CREATE TABLE public.social_media_campaigns (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    created_by character varying NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    objectives jsonb,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    budget numeric(10,2),
    spent_budget numeric(10,2) DEFAULT '0'::numeric,
    target_audience jsonb,
    target_platforms jsonb,
    status character varying(30) DEFAULT 'draft'::character varying,
    post_count integer DEFAULT 0,
    total_impressions integer DEFAULT 0,
    total_engagements integer DEFAULT 0,
    total_conversions integer DEFAULT 0,
    total_revenue numeric(10,2) DEFAULT '0'::numeric,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_media_campaigns OWNER TO neondb_owner;
CREATE TABLE public.social_media_listeners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    type character varying(30) NOT NULL,
    keywords jsonb,
    hashtags jsonb,
    accounts jsonb,
    platforms jsonb,
    alert_enabled boolean DEFAULT false,
    alert_threshold integer,
    alert_emails jsonb,
    is_active boolean DEFAULT true,
    last_checked_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_media_listeners OWNER TO neondb_owner;
CREATE TABLE public.social_media_mentions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    listener_id uuid,
    business_id uuid NOT NULL,
    platform character varying(30) NOT NULL,
    platform_post_id character varying(255),
    author_name character varying(255),
    author_handle character varying(255),
    author_profile_url character varying,
    content text,
    post_url character varying,
    sentiment character varying(20),
    reach integer,
    engagement integer,
    is_influencer boolean DEFAULT false,
    influencer_score integer,
    responded boolean DEFAULT false,
    responded_at timestamp without time zone,
    mentioned_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_media_mentions OWNER TO neondb_owner;
CREATE TABLE public.social_media_messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    account_id uuid NOT NULL,
    platform character varying(30) NOT NULL,
    platform_message_id character varying(255),
    message_type character varying(30) DEFAULT 'direct'::character varying,
    sender_name character varying(255),
    sender_id character varying(255),
    sender_profile_url character varying,
    is_from_business boolean DEFAULT false,
    content text,
    media_urls jsonb,
    parent_message_id uuid,
    thread_id character varying(255),
    status character varying(30) DEFAULT 'unread'::character varying,
    priority character varying(20) DEFAULT 'normal'::character varying,
    sentiment character varying(20),
    assigned_to character varying,
    replied_at timestamp without time zone,
    response_time integer,
    auto_response_sent boolean DEFAULT false,
    auto_response_template uuid,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_media_messages OWNER TO neondb_owner;
CREATE TABLE public.social_media_posts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    author_id character varying NOT NULL,
    content text NOT NULL,
    content_type character varying(30) DEFAULT 'text'::character varying,
    media_urls jsonb,
    thumbnail_url character varying,
    hashtags jsonb,
    mentions jsonb,
    links jsonb,
    status character varying(30) DEFAULT 'draft'::character varying NOT NULL,
    scheduled_at timestamp without time zone,
    published_at timestamp without time zone,
    platforms jsonb NOT NULL,
    platform_posts jsonb,
    campaign_id uuid,
    category_id uuid,
    is_promoted boolean DEFAULT false,
    promotion_budget numeric(10,2),
    needs_approval boolean DEFAULT false,
    approved_by character varying,
    approved_at timestamp without time zone,
    approval_notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_media_posts OWNER TO neondb_owner;
CREATE TABLE public.social_media_team (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id character varying NOT NULL,
    role character varying(50) NOT NULL,
    permissions jsonb,
    can_publish boolean DEFAULT false,
    can_schedule boolean DEFAULT true,
    can_respond boolean DEFAULT true,
    can_view_analytics boolean DEFAULT true,
    can_manage_team boolean DEFAULT false,
    assigned_platforms jsonb,
    is_active boolean DEFAULT true,
    invited_by character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_media_team OWNER TO neondb_owner;
CREATE TABLE public.social_posts (
    id text NOT NULL,
    social_account_id text NOT NULL,
    business_id uuid,
    platform_post_id text,
    platform text NOT NULL,
    post_type text NOT NULL,
    content text,
    media_urls jsonb,
    hashtags jsonb,
    mentions jsonb,
    scheduled_for timestamp without time zone,
    published_at timestamp without time zone,
    status text NOT NULL,
    metrics jsonb,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_posts OWNER TO neondb_owner;
CREATE TABLE public.social_response_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    name character varying(255) NOT NULL,
    category character varying(100),
    content text NOT NULL,
    platforms jsonb,
    triggers jsonb,
    use_count integer DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_response_templates OWNER TO neondb_owner;
CREATE TABLE public.social_tokens (
    id text NOT NULL,
    social_account_id text NOT NULL,
    access_token text NOT NULL,
    refresh_token text,
    expires_at timestamp without time zone,
    scopes jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.social_tokens OWNER TO neondb_owner;
CREATE TABLE public.spotlight_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    type character varying(20) NOT NULL,
    "position" integer,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    engagement_score numeric(5,2),
    quality_score numeric(5,2),
    recency_score numeric(5,2),
    diversity_score numeric(5,2),
    total_score numeric(5,2),
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.spotlight_history OWNER TO neondb_owner;
CREATE TABLE public.spotlight_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    user_id character varying NOT NULL,
    month character varying(7) NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.spotlight_votes OWNER TO neondb_owner;
CREATE TABLE public.spotlights (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    type character varying(20) NOT NULL,
    "position" integer,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.spotlights OWNER TO neondb_owner;
CREATE TABLE public.timeline_showcase_votes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    showcase_id uuid NOT NULL,
    user_id character varying NOT NULL,
    vote_type character varying(10) DEFAULT 'upvote'::character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.timeline_showcase_votes OWNER TO neondb_owner;
CREATE TABLE public.timeline_showcases (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entrepreneur_id uuid,
    business_id uuid,
    author_id character varying NOT NULL,
    type character varying(30) DEFAULT 'story'::character varying NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    excerpt character varying(500),
    media_urls jsonb,
    cta_text character varying(100),
    cta_url character varying(500),
    tags jsonb,
    category character varying(100),
    vote_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    share_count integer DEFAULT 0,
    view_count integer DEFAULT 0,
    is_pinned boolean DEFAULT false,
    is_featured boolean DEFAULT false,
    is_promoted boolean DEFAULT false,
    promotion_spot_id uuid,
    promotion_start_date timestamp without time zone,
    promotion_end_date timestamp without time zone,
    is_approved boolean DEFAULT false,
    approved_by character varying,
    approved_at timestamp without time zone,
    scheduled_at timestamp without time zone,
    published_at timestamp without time zone,
    is_published boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.timeline_showcases OWNER TO neondb_owner;
CREATE TABLE public.user_metrics (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    date timestamp without time zone NOT NULL,
    page_views integer DEFAULT 0,
    session_duration integer DEFAULT 0,
    actions_count integer DEFAULT 0,
    orders_placed integer DEFAULT 0,
    total_spent numeric(12,2) DEFAULT '0'::numeric,
    reviews_written integer DEFAULT 0,
    messages_sent integer DEFAULT 0,
    social_shares integer DEFAULT 0,
    points_earned integer DEFAULT 0,
    points_spent integer DEFAULT 0,
    rewards_redeemed integer DEFAULT 0,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.user_metrics OWNER TO neondb_owner;
CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    role_id uuid NOT NULL,
    assigned_by character varying NOT NULL,
    assigned_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.user_roles OWNER TO neondb_owner;
CREATE TABLE public.user_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    token character varying(255) NOT NULL,
    ip_address character varying(45) NOT NULL,
    user_agent text,
    device_id character varying(255),
    location jsonb,
    last_activity timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.user_sessions OWNER TO neondb_owner;
CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    is_admin boolean DEFAULT false,
    online_status character varying(20) DEFAULT 'offline'::character varying,
    last_seen_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.users OWNER TO neondb_owner;
CREATE TABLE public.vendor_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    business_id uuid NOT NULL,
    order_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    platform_fee numeric(10,2) NOT NULL,
    vendor_payout numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'usd'::character varying NOT NULL,
    stripe_transfer_id character varying,
    stripe_charge_id character varying,
    payment_processor character varying(20) DEFAULT 'stripe'::character varying,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    failure_reason text,
    paid_out_at timestamp without time zone,
    refunded_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);
ALTER TABLE public.vendor_transactions OWNER TO neondb_owner;
CREATE TABLE public.workflow_enrollments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    workflow_id uuid NOT NULL,
    user_id character varying NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    current_step_id character varying(100),
    current_step_started_at timestamp without time zone,
    enrolled_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    exited_at timestamp without time zone,
    exit_reason text,
    enrollment_data jsonb
);
ALTER TABLE public.workflow_enrollments OWNER TO neondb_owner;
CREATE TABLE public.workflow_step_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    enrollment_id uuid NOT NULL,
    workflow_id uuid NOT NULL,
    step_id character varying(100) NOT NULL,
    step_type character varying(100) NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    started_at timestamp without time zone DEFAULT now(),
    completed_at timestamp without time zone,
    error_message text,
    result jsonb
);
ALTER TABLE public.workflow_step_logs OWNER TO neondb_owner;
COPY public.account_lockouts (id, email, lockout_type, locked_at, locked_until, unlocked_at, unlocked_by, reason, attempt_count) FROM stdin;
\.
COPY public.active_sessions (id, user_id, session_id, ip_address, user_agent, device_type, browser, os, is_current, last_activity, expires_at, created_at) FROM stdin;
\.
COPY public.ad_campaigns (id, business_id, ad_spot_id, showcase_id, name, creative_url, target_url, start_date, end_date, total_cost, billing_cycle, impressions, clicks, conversions, status, is_paid, paid_at, created_at, updated_at) FROM stdin;
\.
COPY public.ad_impressions (id, campaign_id, user_id, ip_address, user_agent, referrer, is_click, is_conversion, "timestamp") FROM stdin;
\.
COPY public.ad_spots (id, name, display_name, description, location, "position", price_per_day, price_per_week, price_per_month, dimensions, max_active_slots, is_available, is_active, created_at, updated_at) FROM stdin;
\.
COPY public.admin_audit_logs (id, admin_id, action, entity_type, entity_id, changes, reason, ip_address, user_agent, session_id, status, error_message, metadata, "timestamp") FROM stdin;
\.
COPY public.admin_roles (id, name, description, permissions, is_system_role, created_at, updated_at) FROM stdin;
\.
COPY public.ai_content_templates (id, business_id, name, description, type, category, prompt, variables, examples, tone, platform, is_global, is_active, usage_count, rating, created_by, created_at, updated_at) FROM stdin;
\.
COPY public.ai_content_tests (id, business_id, name, description, type, status, variants, winner_variant_id, start_date, end_date, metrics, created_at, updated_at) FROM stdin;
\.
COPY public.ai_generated_content (id, business_id, user_id, type, platform, content, prompt, enhanced_prompt, tone, language, keywords, hashtags, metadata, quality_metrics, version, parent_id, is_favorite, is_template, template_name, usage_count, performance_metrics, status, published_at, created_at, updated_at) FROM stdin;
\.
COPY public.ai_generated_images (id, business_id, user_id, prompt, enhanced_prompt, negative_prompt, url, local_path, s3_url, metadata, category, tags, variations, is_favorite, usage_count, status, created_at, updated_at) FROM stdin;
\.
COPY public.ai_moderation_log (id, content_id, content_type, business_id, moderation_result, flagged_reasons, is_safe, action, moderated_by, created_at) FROM stdin;
\.
COPY public.ai_usage_tracking (id, business_id, user_id, service, model, type, tokens_used, cost, metadata, billing_period, created_at) FROM stdin;
\.
COPY public.analytics_events (id, event_type, event_category, user_id, business_id, product_id, order_id, session_id, ip_address, user_agent, event_data, "timestamp", processing_time, metadata) FROM stdin;
\.
COPY public.api_keys (id, key_hash, name, business_id, user_id, permissions, rate_limit, is_active, last_used_at, expires_at, created_at, updated_at) FROM stdin;
\.
COPY public.auth_audit_logs (id, user_id, event_type, event_status, ip_address, user_agent, session_id, metadata, created_at) FROM stdin;
8b94f859-990a-4114-813e-83877aefabe8	1qJACX	login_success	success	34.23.28.8	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	ab93e67bca6814e7df2cbd5c2ea8b7fc9581512d511280407a5844421ff98045	{"timestamp": "2025-10-17T15:37:04.805Z"}	2025-10-17 15:37:04.824329
ca57a58d-ea86-45e8-bb97-5397d3f1578a	admin_nI4p-a	login_success	success	34.23.28.8	Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36	7764fdfdb9a5ef8febd2944780ef64cbd04419dbe698714a55c0f88ee569ea8c	{"timestamp": "2025-10-17T15:39:44.115Z"}	2025-10-17 15:39:44.135889
\.
COPY public.blog_analytics (id, post_id, user_id, session_id, view_type, scroll_depth, time_spent_seconds, referrer, utm_source, utm_medium, utm_campaign, device_type, browser, os, country, city, viewed_at) FROM stdin;
\.
COPY public.blog_bookmarks (id, post_id, user_id, reading_list_id, notes, created_at) FROM stdin;
\.
COPY public.blog_categories (id, name, slug, description, color, icon, post_count, is_active, created_at, updated_at) FROM stdin;
\.
COPY public.blog_comments (id, post_id, author_id, parent_comment_id, content, is_edited, edited_at, like_count, reply_count, is_approved, is_flagged, created_at, updated_at) FROM stdin;
\.
COPY public.blog_post_tags (id, post_id, tag_id, created_at) FROM stdin;
\.
COPY public.blog_posts (id, author_id, business_id, title, slug, excerpt, content, featured_image_url, category_id, meta_title, meta_description, meta_keywords, canonical_url, og_image, status, published_at, scheduled_at, view_count, unique_view_count, like_count, comment_count, share_count, bookmark_count, read_completion_rate, avg_read_time_seconds, is_featured, is_pinned, allow_comments, version, last_edited_by, last_edited_at, created_at, updated_at) FROM stdin;
\.
COPY public.blog_reactions (id, post_id, user_id, reaction_type, count, created_at, updated_at) FROM stdin;
\.
COPY public.blog_reading_lists (id, user_id, name, description, is_public, bookmark_count, created_at, updated_at) FROM stdin;
\.
COPY public.blog_revisions (id, post_id, version, edited_by, title, content, excerpt, changes_summary, change_type, created_at) FROM stdin;
\.
COPY public.blog_subscriptions (id, user_id, email, subscribed_to_all, subscribed_categories, subscribed_authors, frequency, is_active, unsubscribe_token, confirmed_at, created_at, updated_at) FROM stdin;
\.
COPY public.blog_tags (id, name, slug, post_count, created_at) FROM stdin;
\.
COPY public.business_followers (id, business_id, user_id, created_at) FROM stdin;
\.
COPY public.business_metrics (id, business_id, date, views, unique_visitors, clicks, revenue, orders, products_listed_count, products_sold_count, new_customers, returning_customers, average_order_value, reviews_received, average_rating, messages_received, messages_replied, spotlight_votes, spotlight_wins, metadata, created_at, updated_at) FROM stdin;
\.
COPY public.businesses (id, owner_id, name, tagline, description, category, location, address, phone, website, logo_url, cover_image_url, operating_hours, social_links, google_place_id, is_verified, is_active, gmb_verified, gmb_connected, gmb_account_id, gmb_location_id, gmb_sync_status, gmb_last_sync_at, gmb_last_error_at, gmb_last_error, gmb_data_sources, stripe_account_id, stripe_onboarding_status, stripe_charges_enabled, stripe_payouts_enabled, payment_integrations, mini_store_enabled, mini_store_config, rating, review_count, follower_count, post_count, created_at, updated_at) FROM stdin;
0022ecec-a4d8-4170-88b9-9c407e390b65	admin-rob-fusion	Fusion Data Co	Where Automation Meets Revenue Intelligence	Premier workflow automation and revenue intelligence firm that transforms how businesses generate, qualify, and convert leads. We architect sophisticated automation systems that enable small sales teams to perform at enterprise scale.\n\nMission: Democratize enterprise-grade automation for growing businesses. Every company deserves sales infrastructure that works 24/7/365.\n\nWhat Makes Us Different:\n• Zero-fluff implementations - every workflow drives measurable ROI\n• Proprietary frameworks from 200+ successful deployments\n• AI-native approach integrating LLMs into every automation layer\n• White-glove service with direct founder involvement\n• Rapid deployment cycles (weeks, not months)\n\nServices: Lead Generation Architecture, Sales Automation Engineering, AI Agent Development, System Integration & Migration, Training & Enablement\n\nTarget Markets: B2B SaaS, Solar/Renewable Energy, Real Estate Technology, Professional Services, E-commerce\n\nResults: $50M+ in attributed client revenue, 98% client retention, 4.9/5 satisfaction score	Business Automation & AI Solutions	Sacramento, CA (Remote-First)	Remote Operations - Mobile RV Workspace	(916) 555-DATA	https://fusiondataco.com	\N	\N	{"friday": "9:00 AM - 6:00 PM PT", "monday": "9:00 AM - 6:00 PM PT", "sunday": "Closed", "tuesday": "9:00 AM - 6:00 PM PT", "saturday": "Closed", "thursday": "9:00 AM - 6:00 PM PT", "wednesday": "9:00 AM - 6:00 PM PT"}	{"github": "/FusionDataCo", "twitter": "@FusionDataCo", "website": "https://fusiondataco.com", "linkedin": "/company/fusion-data-co"}	\N	t	t	f	f	\N	\N	none	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	4.90	127	1200	89	2025-10-15 19:04:43.687839	2025-10-15 19:04:43.687839
8e5b776b-492a-4a37-bc42-92f4901c2166	elite-jason-perez	The Insurance School	We Make Licensing EASY❗️	Florida's premier D.F.S. Authorized Insurance Education Provider since 1998. We help 2,000+ Florida locals every month get their insurance licenses and launch successful careers through live state-authorized classes, on-demand course replays, and comprehensive exam prep. Our study group atmosphere and #NeverHuntAlone philosophy ensures you have the support and resources needed to pass your state exam on the first try.	Education & Training	Orlando, Florida	\N	(407) 555-2015	https://theinsuranceschool.com	\N	\N	\N	{"skool": "The Insurance School Community", "youtube": "https://youtube.com/@ipowermoves", "facebook": "https://facebook.com/theinsuranceschool", "instagram": "https://instagram.com/theinsuranceschool"}	\N	t	t	f	f	\N	\N	none	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	4.90	487	2150	324	2025-10-15 19:04:43.995526	2025-10-15 19:04:43.995526
e7ba150e-8ad5-46d9-a331-97bd52ec0177	elite-kelli-kirk	Boho Hooligan	Handcrafted Bohemian Jewelry & Accessories for Free Spirits	Boho Hooligan creates unique, handcrafted bohemian jewelry and accessories that celebrate free-spirited style and artistic expression. Each piece is carefully designed and crafted to bring vintage charm and modern boho aesthetics together, creating wearable art that tells your story.	Arts & Crafts	Florida	\N	\N	https://www.etsy.com/ca/shop/BohoHooligan	\N	\N	\N	{"etsy": "https://www.etsy.com/ca/shop/BohoHooligan", "instagram": "https://instagram.com/bohohooligan", "pinterest": "https://pinterest.com/bohohooligan"}	\N	t	t	f	f	\N	\N	none	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	4.80	342	920	156	2025-10-15 19:04:44.198939	2025-10-15 19:04:44.198939
1c882f16-33c1-42a1-935d-ec51b408c48d	elite-ted-bogert	The Ted Show	Connecting Central Florida's Leaders, Innovators & Change-Makers	The Ted Show is Central Florida's premier daily talk show, bringing you high-energy conversations with community leaders, entrepreneurs, veterans, innovators, and philanthropists. Since launching in August 2017, we've filmed thousands of episodes featuring the people and stories that make Orlando and Central Florida exceptional.\n\nEach weekday at 1pm EST on Facebook Live, host Ted Bogert welcomes guests to discuss business development, arts and culture, community engagement, entrepreneurship, real estate, finance, veteran affairs, and local events. Our 'Heroes Always Welcome' segment specifically honors U.S. military veterans and their inspiring stories.\n\nWhether you're looking to share your business story, connect with Central Florida's engaged community, or amplify your message through The Florida Local network, The Ted Show provides the platform and audience to make it happen.	Media & Broadcasting	Orlando, Florida	255 S Orange Ave, Suite 213, Orlando, FL 32801	(407) 555-SHOW	https://thetedshow.com	\N	\N	{"friday": {"open": "13:00", "close": "14:00", "notes": "Live show 1pm EST"}, "monday": {"open": "13:00", "close": "14:00", "notes": "Live show 1pm EST"}, "tuesday": {"open": "13:00", "close": "14:00", "notes": "Live show 1pm EST"}, "thursday": {"open": "13:00", "close": "14:00", "notes": "Live show 1pm EST"}, "wednesday": {"open": "13:00", "close": "14:00", "notes": "Live show 1pm EST"}}	{"website": "https://community.expert", "youtube": "https://youtube.com/@thetedshow", "facebook": "https://facebook.com/thetedshow", "linkedin": "https://linkedin.com/company/thetedshow"}	\N	t	t	f	f	\N	\N	none	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	5.00	892	12400	3247	2025-10-15 19:04:44.415818	2025-10-15 19:04:44.415818
0e896397-caa7-4887-beee-2510c396f11c	elite-neil-schwabe	Neil Schwabe & Associates	Independent Health Insurance Representation - First, Foremost, and Always	Neil Schwabe & Associates provides independent broker services representing client interests across all health coverage plans. With 30+ years of national experience and MGA-level expertise, we specialize in health, life, and annuity insurance for individuals, families, and small businesses.\n\nAs a Managing General Agent (MGA) - the highest level of carrier contract - we perform critical industry functions including plan development, underwriting, appointing retail agents, and settling claims. Our independent status allows us to work with multiple carriers, staying informed on market changes to provide clients with the best options.\n\nWe're committed to making insurance choices easy through education and clarity, offering tailored solutions over one-size-fits-all approaches. Our monthly newsletter keeps clients informed on upcoming dates, plan best practices, healthy living resources, terminology, and policy updates.	Insurance & Financial Services	Miami, Florida	2665 S Bayshore Dr STE 220, Miami, FL 33133	(305) 270-1990	https://www.neilschwabe.com	\N	\N	{"friday": {"open": "9:00", "close": "17:00"}, "monday": {"open": "9:00", "close": "17:00"}, "tuesday": {"open": "9:00", "close": "17:00"}, "thursday": {"open": "9:00", "close": "17:00"}, "wednesday": {"open": "9:00", "close": "17:00"}}	{"website": "https://www.neilschwabe.com", "linkedin": "https://www.linkedin.com/in/neil-schwabe"}	\N	t	t	f	f	\N	\N	none	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	4.90	524	2180	487	2025-10-15 19:04:44.620116	2025-10-15 19:04:44.620116
9c769fa4-1f56-4ae8-b667-94ce8186a7d7	admin-rob-fusion	Fusion Data Co	Where Automation Meets Revenue Intelligence	Premier workflow automation and revenue intelligence firm that transforms how businesses generate, qualify, and convert leads. We architect sophisticated automation systems that enable small sales teams to perform at enterprise scale.\n\nMission: Democratize enterprise-grade automation for growing businesses. Every company deserves sales infrastructure that works 24/7/365.\n\nWhat Makes Us Different:\n• Zero-fluff implementations - every workflow drives measurable ROI\n• Proprietary frameworks from 200+ successful deployments\n• AI-native approach integrating LLMs into every automation layer\n• White-glove service with direct founder involvement\n• Rapid deployment cycles (weeks, not months)\n\nServices: Lead Generation Architecture, Sales Automation Engineering, AI Agent Development, System Integration & Migration, Training & Enablement\n\nTarget Markets: B2B SaaS, Solar/Renewable Energy, Real Estate Technology, Professional Services, E-commerce\n\nResults: $50M+ in attributed client revenue, 98% client retention, 4.9/5 satisfaction score	Business Automation & AI Solutions	Sacramento, CA (Remote-First)	Remote Operations - Mobile RV Workspace	(916) 555-DATA	https://fusiondataco.com	\N	\N	{"friday": "9:00 AM - 6:00 PM PT", "monday": "9:00 AM - 6:00 PM PT", "sunday": "Closed", "tuesday": "9:00 AM - 6:00 PM PT", "saturday": "Closed", "thursday": "9:00 AM - 6:00 PM PT", "wednesday": "9:00 AM - 6:00 PM PT"}	{"github": "/FusionDataCo", "twitter": "@FusionDataCo", "website": "https://fusiondataco.com", "linkedin": "/company/fusion-data-co"}	\N	t	t	f	f	\N	\N	none	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	4.90	127	1200	89	2025-10-15 19:51:47.274528	2025-10-15 19:51:47.274528
e4d2f924-d953-49df-9e97-bc9878637909	elite-jason-perez	The Insurance School	We Make Licensing EASY❗️	Florida's premier D.F.S. Authorized Insurance Education Provider since 1998. We help 2,000+ Florida locals every month get their insurance licenses and launch successful careers through live state-authorized classes, on-demand course replays, and comprehensive exam prep. Our study group atmosphere and #NeverHuntAlone philosophy ensures you have the support and resources needed to pass your state exam on the first try.	Education & Training	Orlando, Florida	\N	(407) 555-2015	https://theinsuranceschool.com	\N	\N	\N	{"skool": "The Insurance School Community", "youtube": "https://youtube.com/@ipowermoves", "facebook": "https://facebook.com/theinsuranceschool", "instagram": "https://instagram.com/theinsuranceschool"}	\N	t	t	f	f	\N	\N	none	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	4.90	487	2150	324	2025-10-15 19:51:47.588423	2025-10-15 19:51:47.588423
92dd241d-db94-4eb6-a1c1-54f778f2056f	elite-kelli-kirk	Boho Hooligan	Handcrafted Bohemian Jewelry & Accessories for Free Spirits	Boho Hooligan creates unique, handcrafted bohemian jewelry and accessories that celebrate free-spirited style and artistic expression. Each piece is carefully designed and crafted to bring vintage charm and modern boho aesthetics together, creating wearable art that tells your story.	Arts & Crafts	Florida	\N	\N	https://www.etsy.com/ca/shop/BohoHooligan	\N	\N	\N	{"etsy": "https://www.etsy.com/ca/shop/BohoHooligan", "instagram": "https://instagram.com/bohohooligan", "pinterest": "https://pinterest.com/bohohooligan"}	\N	t	t	f	f	\N	\N	none	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	4.80	342	920	156	2025-10-15 19:51:47.786723	2025-10-15 19:51:47.786723
bd5c872b-8989-402a-b090-a7a887bffd28	elite-ted-bogert	The Ted Show	Connecting Central Florida's Leaders, Innovators & Change-Makers	The Ted Show is Central Florida's premier daily talk show, bringing you high-energy conversations with community leaders, entrepreneurs, veterans, innovators, and philanthropists. Since launching in August 2017, we've filmed thousands of episodes featuring the people and stories that make Orlando and Central Florida exceptional.\n\nEach weekday at 1pm EST on Facebook Live, host Ted Bogert welcomes guests to discuss business development, arts and culture, community engagement, entrepreneurship, real estate, finance, veteran affairs, and local events. Our 'Heroes Always Welcome' segment specifically honors U.S. military veterans and their inspiring stories.\n\nWhether you're looking to share your business story, connect with Central Florida's engaged community, or amplify your message through The Florida Local network, The Ted Show provides the platform and audience to make it happen.	Media & Broadcasting	Orlando, Florida	255 S Orange Ave, Suite 213, Orlando, FL 32801	(407) 555-SHOW	https://thetedshow.com	\N	\N	{"friday": {"open": "13:00", "close": "14:00", "notes": "Live show 1pm EST"}, "monday": {"open": "13:00", "close": "14:00", "notes": "Live show 1pm EST"}, "tuesday": {"open": "13:00", "close": "14:00", "notes": "Live show 1pm EST"}, "thursday": {"open": "13:00", "close": "14:00", "notes": "Live show 1pm EST"}, "wednesday": {"open": "13:00", "close": "14:00", "notes": "Live show 1pm EST"}}	{"website": "https://community.expert", "youtube": "https://youtube.com/@thetedshow", "facebook": "https://facebook.com/thetedshow", "linkedin": "https://linkedin.com/company/thetedshow"}	\N	t	t	f	f	\N	\N	none	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	5.00	892	12400	3247	2025-10-15 19:51:47.990899	2025-10-15 19:51:47.990899
36541438-bf16-4238-a56c-1581403d51cd	elite-neil-schwabe	Neil Schwabe & Associates	Independent Health Insurance Representation - First, Foremost, and Always	Neil Schwabe & Associates provides independent broker services representing client interests across all health coverage plans. With 30+ years of national experience and MGA-level expertise, we specialize in health, life, and annuity insurance for individuals, families, and small businesses.\n\nAs a Managing General Agent (MGA) - the highest level of carrier contract - we perform critical industry functions including plan development, underwriting, appointing retail agents, and settling claims. Our independent status allows us to work with multiple carriers, staying informed on market changes to provide clients with the best options.\n\nWe're committed to making insurance choices easy through education and clarity, offering tailored solutions over one-size-fits-all approaches. Our monthly newsletter keeps clients informed on upcoming dates, plan best practices, healthy living resources, terminology, and policy updates.	Insurance & Financial Services	Miami, Florida	2665 S Bayshore Dr STE 220, Miami, FL 33133	(305) 270-1990	https://www.neilschwabe.com	\N	\N	{"friday": {"open": "9:00", "close": "17:00"}, "monday": {"open": "9:00", "close": "17:00"}, "tuesday": {"open": "9:00", "close": "17:00"}, "thursday": {"open": "9:00", "close": "17:00"}, "wednesday": {"open": "9:00", "close": "17:00"}}	{"website": "https://www.neilschwabe.com", "linkedin": "https://www.linkedin.com/in/neil-schwabe"}	\N	t	t	f	f	\N	\N	none	\N	\N	\N	\N	\N	\N	f	f	\N	f	\N	4.90	524	2180	487	2025-10-15 19:51:48.204575	2025-10-15 19:51:48.204575
\.
COPY public.campaign_clicks (id, campaign_id, recipient_id, link_id, clicked_at, ip_address, user_agent, device_type, browser, os, country, city) FROM stdin;
\.
COPY public.campaign_links (id, campaign_id, original_url, short_code, tracking_url, click_count, unique_click_count, created_at) FROM stdin;
\.
COPY public.campaign_recipients (id, campaign_id, user_id, email, phone, first_name, last_name, status, sent_at, delivered_at, opened_at, first_clicked_at, bounced_at, open_count, click_count, last_opened_at, last_clicked_at, error_message, bounce_type, external_message_id, external_status, created_at, updated_at) FROM stdin;
\.
COPY public.cart_items (id, user_id, product_id, quantity, added_at) FROM stdin;
\.
COPY public.chat_analytics (id, conversation_id, duration, message_count, user_message_count, assistant_message_count, avg_response_time, min_response_time, max_response_time, total_tokens, total_cost, models_used, sentiment_progression, intent_changes, kb_hit_rate, resolved, escalated, satisfaction_score, conversion_event, conversion_value, peak_hour, day_of_week, created_at) FROM stdin;
\.
COPY public.chat_conversations (id, user_id, session_id, title, status, channel, business_id, metadata, tags, intent, sentiment, language, message_count, satisfaction_score, satisfaction_comment, resolved, resolved_at, resolution_time, escalated, escalated_at, escalated_to, escalation_reason, created_at, updated_at, last_message_at) FROM stdin;
\.
COPY public.chat_knowledge_base (id, category, subcategory, question, answer, alternative_questions, keywords, title, slug, summary, related_articles, external_links, embedding, embedding_model, view_count, use_count, helpful_count, not_helpful_count, is_active, priority, created_by, last_edited_by, created_at, updated_at) FROM stdin;
\.
COPY public.chat_messages (id, conversation_id, role, content, message_type, attachments, metadata, model, tokens, latency, temperature, intent, sentiment, entities, knowledge_base_used, knowledge_base_articles, helpful, feedback_comment, flagged, flag_reason, status, error_message, created_at, read_at) FROM stdin;
\.
COPY public.chat_proactive_triggers (id, name, description, trigger_type, conditions, message, quick_replies, target_pages, requires_auth, exclude_if_conversation_exists, max_shows_per_session, cooldown_minutes, show_count, engagement_count, engagement_rate, priority, is_active, created_at, updated_at) FROM stdin;
\.
COPY public.chat_quick_actions (id, label, action_type, action_payload, icon, variant, description, show_on_pages, show_for_intents, requires_auth, click_count, conversion_count, display_order, is_active, created_at, updated_at) FROM stdin;
\.
COPY public.chat_sessions (id, session_id, user_id, device_info, ip_address, user_agent, location, initial_page, referrer, utm_params, page_views, last_activity, is_active, conversation_count, messages_sent, avg_response_time, created_at, expires_at) FROM stdin;
\.
COPY public.conversion_funnels (id, funnel_name, date, step1_count, step2_count, step3_count, step4_count, step5_count, step1_to_step2_rate, step2_to_step3_rate, step3_to_step4_rate, step4_to_step5_rate, overall_conversion_rate, metadata, created_at, updated_at) FROM stdin;
\.
COPY public.customer_cohorts (id, cohort_name, cohort_type, cohort_date, user_count, active_users, retention_rate, total_revenue, average_revenue_per_user, average_orders_per_user, average_lifetime_value, metadata, created_at, updated_at) FROM stdin;
\.
COPY public.customer_segments (id, business_id, name, description, criteria, member_count, auto_update, last_calculated_at, is_active, created_at, updated_at) FROM stdin;
\.
COPY public.daily_metrics (id, date, total_revenue, order_count, average_order_value, new_users, active_users, returning_users, new_businesses, active_businesses, products_listed, products_sold, points_earned, points_redeemed, rewards_redeemed, reviews_created, messages_exchanged, social_shares, referrals_sent, referrals_completed, metadata, created_at, updated_at) FROM stdin;
\.
COPY public.device_fingerprints (id, user_id, fingerprint, device_name, device_type, os, browser, browser_version, screen_resolution, trusted, last_seen, ip_address, location, created_at) FROM stdin;
\.
COPY public.engagement_metrics (id, business_id, followers_growth, posts_engagement, recent_activity, product_views, profile_views, order_count, last_featured_daily, last_featured_weekly, last_featured_monthly, calculated_at, updated_at) FROM stdin;
\.
COPY public.entrepreneur_businesses (id, entrepreneur_id, business_id, role, equity_percentage, joined_date, left_date, is_current, is_public, created_at) FROM stdin;
6c0d3a21-f7f2-487d-96ea-ae37113f48d3	4f2073db-d9d0-40ae-8841-39db941b7165	0022ecec-a4d8-4170-88b9-9c407e390b65	Founder & Chief Automation Officer	50.00	2025-10-15 19:04:43.738512	\N	t	t	2025-10-15 19:04:43.738512
7ccee87c-df20-4db3-9caa-9f997fc1808d	32d126f8-efb1-4b74-a03e-c777378e93ac	0022ecec-a4d8-4170-88b9-9c407e390b65	Co-Founder & Automation Strategist	50.00	2025-10-15 19:04:43.841589	\N	t	t	2025-10-15 19:04:43.841589
98bc1479-e6bf-4115-bf73-47cb4c057531	db1712ba-05d8-4a8b-b925-87812dc8d7b9	8e5b776b-492a-4a37-bc42-92f4901c2166	Founder & Chief Compliance Officer	100.00	2025-10-15 19:04:44.046237	\N	t	t	2025-10-15 19:04:44.046237
2144f495-22b9-48d3-9270-8b75b92ee913	7ab49c3e-ccf3-4aff-99fa-374323b9f1da	e7ba150e-8ad5-46d9-a331-97bd52ec0177	Founder & Artisan	100.00	2025-10-15 19:04:44.258156	\N	t	t	2025-10-15 19:04:44.258156
71f25265-2b2c-44b6-b924-ebdbcdaf964a	bcae8106-5318-4233-97db-766edda07d11	1c882f16-33c1-42a1-935d-ec51b408c48d	Host & Creator	100.00	2025-10-15 19:04:44.465508	\N	t	t	2025-10-15 19:04:44.465508
91ae3e2d-ced7-46d1-a887-05a2198bbaaf	0fd654d3-193f-486f-b676-5a512aa69262	0e896397-caa7-4887-beee-2510c396f11c	Founder & Managing General Agent	100.00	2025-10-15 19:04:44.66975	\N	t	t	2025-10-15 19:04:44.66975
e5eb6f73-8c09-4c91-a603-2769d69953e2	4f2073db-d9d0-40ae-8841-39db941b7165	9c769fa4-1f56-4ae8-b667-94ce8186a7d7	Founder & Chief Automation Officer	50.00	2025-10-15 19:51:47.326667	\N	t	t	2025-10-15 19:51:47.326667
8b26cd5f-0794-4509-a459-414d4cd28e96	32d126f8-efb1-4b74-a03e-c777378e93ac	9c769fa4-1f56-4ae8-b667-94ce8186a7d7	Co-Founder & Automation Strategist	50.00	2025-10-15 19:51:47.434938	\N	t	t	2025-10-15 19:51:47.434938
be2a2f00-a01c-442a-a1df-9d0874310624	db1712ba-05d8-4a8b-b925-87812dc8d7b9	e4d2f924-d953-49df-9e97-bc9878637909	Founder & Chief Compliance Officer	100.00	2025-10-15 19:51:47.638613	\N	t	t	2025-10-15 19:51:47.638613
ece00e6d-cf49-46ea-a225-3177ea768a2d	7ab49c3e-ccf3-4aff-99fa-374323b9f1da	92dd241d-db94-4eb6-a1c1-54f778f2056f	Founder & Artisan	100.00	2025-10-15 19:51:47.836581	\N	t	t	2025-10-15 19:51:47.836581
d6277250-4592-4673-a262-d433cc4ea9f5	bcae8106-5318-4233-97db-766edda07d11	bd5c872b-8989-402a-b090-a7a887bffd28	Host & Creator	100.00	2025-10-15 19:51:48.040977	\N	t	t	2025-10-15 19:51:48.040977
e57d27ca-6dad-45d1-ac39-6f76569a3d63	0fd654d3-193f-486f-b676-5a512aa69262	36541438-bf16-4238-a56c-1581403d51cd	Founder & Managing General Agent	100.00	2025-10-15 19:51:48.256186	\N	t	t	2025-10-15 19:51:48.256186
\.
COPY public.entrepreneurs (id, user_id, first_name, last_name, bio, story, tagline, profile_image_url, cover_image_url, social_links, achievements, specialties, location, website, years_experience, total_businesses_owned, total_revenue_generated, follower_count, showcase_count, is_verified, is_featured, created_at, updated_at) FROM stdin;
4f2073db-d9d0-40ae-8841-39db941b7165	admin-rob-fusion	Robert	Yeager	Transforming Sales Operations Through Intelligent Automation | Helping Companies Scale Revenue Without Scaling Headcount	Results-driven workflow automation architect with 15+ years of experience engineering revenue-generating systems for scaling businesses. Specializes in designing sophisticated lead generation pipelines, sales automation frameworks, and AI-powered business intelligence solutions.\n\nPhilosophy: "The best sales team is the one that never sleeps. Automation doesn't replace humans—it amplifies them."\n\nProfessional Journey:\n• Founded Fusion Data Co (2020) - architected 200+ automated workflows generating $50M+ in attributed revenue\n• Senior Workflow Consultant (2015-2020) - consulted for 40+ companies on sales automation strategy\n• Sales Operations Manager (2010-2015) - managed sales tech stack for 50+ rep teams\n\nLocation-independent operations from custom RV workspace ("The MotherShip"), advocating for remote-first, automation-driven business models.	Workflow Automation Architect & Lead Generation Strategist	\N	\N	{"github": "/FusionDataCo", "twitter": "@FusionDataCo", "website": "https://fusiondataco.com", "linkedin": "robert-yeager-automation"}	["Architected 200+ automated workflows generating $50M+ in attributed revenue", "Developed proprietary lead scoring algorithms improving efficiency by 340%", "Built AI-powered voice agents processing 10K+ qualification calls monthly", "Reduced client CAC by average of 62% through automation optimization", "Enabled 3-person sales teams to perform at 15-person capacity", "N8N Certified Workflow Developer", "Make.com Advanced Automation Specialist", "10,000+ hours in automation engineering"]	["Workflow Automation (N8N, Make.com, Zapier)", "Multi-channel Lead Generation", "CRM Optimization & Sales Funnel Engineering", "AI Agent Development & Voice Automation", "Full-stack Integration (APIs, Webhooks)", "Data Enrichment & Attribution Modeling"]	Sacramento, CA (Remote/Mobile RV-based)	https://fusiondataco.com	15	0	\N	850	0	t	t	2025-10-15 19:04:43.628764	2025-10-15 19:51:47.19
7ab49c3e-ccf3-4aff-99fa-374323b9f1da	elite-kelli-kirk	Kelli	Kirk	Founder of Boho Hooligan - Creating unique, handcrafted bohemian jewelry and accessories that celebrate free-spirited style. Each piece tells a story and brings artistic expression to everyday wear.	Kelli Kirk turned her passion for bohemian artistry into Boho Hooligan, a thriving Etsy shop that has captured the hearts of free spirits everywhere. Her handcrafted jewelry and accessories blend vintage charm with modern boho aesthetics, creating one-of-a-kind pieces that celebrate individuality and artistic expression.	Handcrafted Bohemian Artisan Jewelry & Accessories	\N	\N	{"etsy": "https://www.etsy.com/ca/shop/BohoHooligan", "instagram": "https://instagram.com/bohohooligan"}	["Successful Etsy Store Owner", "Thousands of satisfied customers", "Unique boho jewelry designs", "Featured products and reviews"]	["Handcrafted Jewelry", "Bohemian Accessories", "Artisan Crafts", "Etsy Sales", "Product Photography"]	Florida	https://www.etsy.com/ca/shop/BohoHooligan	8	0	\N	850	0	t	f	2025-10-15 19:04:44.147594	2025-10-15 19:51:47.709
bcae8106-5318-4233-97db-766edda07d11	elite-ted-bogert	Ted	Bogert	With 30+ years in the people business across insurance, mortgage, and real estate, Ted Bogert helps professionals, business owners, and families marshal their resources and protect their assets. Creator of 'The Ted Show' - a daily Facebook Live talk show connecting Central Florida's community leaders, entrepreneurs, and innovators since 2017.	Ted Bogert's journey spans three decades of serving people across multiple industries. After earning his Bachelor's in Finance and Master's in Health Care Administration from UCF, he built a distinguished career in insurance, mortgage, and real estate. But Ted's true calling emerged in 2017 when he launched The Ted Show from Orlando's Citrus Club - a high-energy daily talk show that has since filmed thousands of episodes, featuring community leaders, veterans, entrepreneurs, and innovators.\n\nAs Market Leader at Future Home Loans (NMLS #945102), Ted combines his extensive mortgage expertise with his passion for community building. His 'Heroes Always Welcome' segment honors U.S. military veterans, while his Community.Expert platform connects real estate agents, attorneys, and business owners with charitable causes.\n\nTed's work extends far beyond business. He's deeply involved with Harbor House (domestic abuse prevention), BASE Camp Children's Cancer Foundation, The Lifeboat Project (human trafficking survivors), Special Olympics, Central Florida Navy League, and the Florida Association of Veteran Owned Businesses. Married to his college sweetheart with three children and one grandson, Ted lives by a simple philosophy: 'Connect. Refer. Repeat.' - always coming from contribution with a focus on others' growth.	Host & Creator of The Ted Show | Community Expert | Market Leader at Future Home Loans	\N	\N	{"website": "https://thetedshow.com", "facebook": "https://facebook.com/thetedshow", "linkedin": "https://linkedin.com/in/tedbogert", "community": "https://community.expert"}	["Creator & Host of The Ted Show (2017-Present)", "Thousands of episodes filmed", "NMLS #945102 - Licensed Mortgage Professional", "Market Leader at Future Home Loans", "Co-creator of Community.Expert platform", "Bachelor of Science in Finance (UCF 1989)", "Master's in Health Care Administration (UCF)", "30+ years multi-industry expertise", "Active in 10+ charitable organizations", "Professional emcee and traveling speaker"]	["Media & Broadcasting", "Mortgage Lending (VA Loans Specialist)", "Community Building", "Business Development", "Content Creation", "Public Speaking", "Network Building", "Real Estate Finance", "Veteran Services"]	Orlando, Florida	https://thetedshow.com	30	0	\N	8500	1247	t	t	2025-10-15 19:04:44.365926	2025-10-15 19:51:47.908
32d126f8-efb1-4b74-a03e-c777378e93ac	admin-mat-fusion	Mat	Mercado	Co-Founder at Fusion Data Co, specializing in sales automation and revenue intelligence. Helping businesses transform their operations through intelligent workflow automation and AI-powered solutions.	Mat Mercado is Co-Founder of Fusion Data Co, working alongside Rob Yeager to democratize enterprise-grade automation for growing businesses. With deep expertise in sales operations and process optimization, Mat helps clients design and implement automation systems that drive measurable ROI.\n\nMat's focus is on translating complex business requirements into elegant automation solutions that scale. He specializes in CRM optimization, multi-channel outbound strategies, and building AI-native architectures that integrate LLMs at every workflow layer.\n\nHis approach combines technical expertise with strategic thinking, ensuring every automation drives real business value. Mat believes that automation should amplify human capabilities, not replace them, and works directly with clients to ensure successful implementations and ongoing optimization.	Co-Founder & Automation Strategist at Fusion Data Co	\N	\N	{"email": "mat@fusiondataco.com", "website": "https://fusiondataco.com"}	["Co-Founded Fusion Data Co (2020)", "200+ successful automation deployments", "Expert in sales operations scaling", "Strategic automation consulting", "AI-native workflow architecture"]	["Sales Automation Strategy", "CRM Optimization", "Process Engineering", "AI Integration", "Revenue Operations", "Client Success & Implementation"]	Remote	https://fusiondataco.com	10	0	\N	680	0	t	t	2025-10-15 19:04:43.792722	2025-10-15 19:51:47.353
db1712ba-05d8-4a8b-b925-87812dc8d7b9	elite-jason-perez	Jason	Perez	Founder & Chief Compliance Officer of The Insurance School - Florida's premier D.F.S. Authorized Insurance Education Provider. We've helped 2,000+ Florida locals every month get their insurance licenses and launch successful careers.	With 25+ years in insurance education, Jason Perez has built The Insurance School into Central Florida's most trusted licensing education platform. His mission is simple: #NeverHuntAlone. Through live classes, on-demand replays, and community support, Jason has helped thousands of Florida residents transform their careers in the insurance industry. His innovative approach combines state-authorized pre-licensing with real-world exam strategies, creating a study group atmosphere where students thrive together.	Helping Florida Locals Get Licensed & Launch Insurance Careers	\N	\N	{"website": "https://theinsuranceschool.com", "community": "https://thefloridalocal.com"}	["Founded The Insurance School (1998)", "D.F.S. Authorized Insurance Education Provider", "2,000+ students monthly", "High first-time pass rate", "Creator of iPower Moves Podcast"]	["Insurance Education", "2-15 Health & Life Licensing", "State Exam Preparation", "Compliance Training", "Student Success"]	Orlando, Florida	https://theinsuranceschool.com	25	0	\N	2000	0	t	t	2025-10-15 19:04:43.942273	2025-10-15 19:51:47.506
0fd654d3-193f-486f-b676-5a512aa69262	elite-neil-schwabe	Neil	Schwabe	Managing General Agent (MGA) with 30+ years of health insurance expertise. As an independent broker, I represent client interests 'First, Foremost, and Always' - providing personal, professional representation across all health coverage plans with multiple carriers nationwide.	Since 1993, Neil Schwabe has built a reputation as one of the nation's top health insurance professionals. As a Managing General Agent (MGA) - the highest level of carrier contract in the health insurance industry - Neil performs critical functions including plan development, underwriting, appointing retail agents, and settling claims.\n\nNeil's career includes founding GetInsurancePlans.com (2004) and GetHealthInsurance.com (2005), pioneering web-based insurance portals that revolutionized how individuals and businesses access coverage. His Miami Dade College education laid the foundation for a career dedicated to making insurance choices easy through education and clarity.\n\nAs founder of Neil Schwabe & Associates and Schwabe Benefits Group (founded 1980), Neil specializes in health, life, and annuity insurance for individuals, families, and small businesses. His Independent Agent Conglomerate teaches agents how to scale their businesses through proven lead generation and sales strategies.\n\nNeil's commitment to client education is evident in his monthly newsletters covering upcoming dates, plan best practices, healthy living resources, terminology, and policy updates. Operating nationally with a home base in Miami, Neil emphasizes tailored solutions over one-size-fits-all approaches.	LUTCF, MGA | Top Health Insurance Expert | 30+ Years National Experience	\N	\N	{"email": "neil@schwabebenefitsgroup.com", "website": "https://www.neilschwabe.com", "linkedin": "https://www.linkedin.com/in/neil-schwabe"}	["LUTCF - Life Underwriter Training Council Fellow", "MGA - Managing General Agent (Highest carrier contract level)", "30+ years in insurance (since 1993)", "Founded Schwabe Benefits Group (1980)", "Founded GetInsurancePlans.com (2004-2017)", "Founded GetHealthInsurance.com (2005-2014)", "Creator of Independent Agent Conglomerate", "National consultant (not limited to Florida)", "500+ LinkedIn connections", "Recognized as 'Top Health Insurance Expert'"]	["Health Insurance (Primary)", "Life Insurance", "Annuity Insurance", "Small Business Group Coverage", "Individual & Family Coverage", "Managing General Agent (MGA)", "Plan Development", "Agent Training & Mentorship", "Lead Generation Strategies"]	Miami, Florida	https://www.neilschwabe.com	30	0	\N	1840	0	t	t	2025-10-15 19:04:44.566157	2025-10-15 19:51:48.118
\.
COPY public.error_logs (id, error_hash, message, stack, category, severity, user_id, request_path, request_method, ip_address, user_agent, count, first_seen_at, last_seen_at, resolved, resolved_by, resolved_at, notes) FROM stdin;
\.
COPY public.failed_login_attempts (id, email, ip_address, user_agent, failure_reason, attempt_time, geo_location) FROM stdin;
\.
COPY public.geo_restrictions (id, country_code, region_code, restriction_type, reason, is_active, created_by, created_at) FROM stdin;
\.
COPY public.gmb_reviews (id, business_id, gmb_review_id, reviewer_name, reviewer_photo_url, rating, comment, review_time, reply_comment, reply_time, gmb_create_time, gmb_update_time, is_visible, imported_at, last_synced_at) FROM stdin;
\.
COPY public.gmb_sync_history (id, business_id, sync_type, status, data_types, changes, error_details, items_processed, items_updated, items_errors, duration_ms, triggered_by, gmb_api_version, created_at) FROM stdin;
\.
COPY public.gmb_tokens (id, business_id, user_id, access_token, refresh_token, token_type, expires_at, scope, is_active, created_at, updated_at) FROM stdin;
\.
COPY public.ip_access_control (id, ip_address, ip_range, access_type, reason, expires_at, is_active, created_by, created_at, updated_at) FROM stdin;
\.
COPY public.lead_capture_forms (id, business_id, name, description, fields, success_message, redirect_url, add_to_segment_id, enroll_in_workflow_id, submission_count, conversion_rate, is_active, created_at, updated_at) FROM stdin;
\.
COPY public.lead_submissions (id, form_id, business_id, user_id, form_data, email, phone, ip_address, user_agent, referrer, utm_source, utm_medium, utm_campaign, status, submitted_at, created_at) FROM stdin;
\.
COPY public.loyalty_accounts (id, user_id, current_points, lifetime_points, tier_id, tier_name, tier_level, enrolled_at, last_activity_at, points_expiring_next_30_days, created_at, updated_at) FROM stdin;
\.
COPY public.loyalty_rules (id, name, description, event_type, points_awarded, calculation_type, calculation_value, min_amount, max_points, tier_multipliers, is_active, start_date, end_date, created_at, updated_at) FROM stdin;
\.
COPY public.loyalty_tiers (id, name, level, points_required, benefits, discount_percentage, free_shipping_threshold, priority_support, early_access, color, icon, created_at, updated_at) FROM stdin;
\.
COPY public.loyalty_transactions (id, user_id, account_id, type, points, balance_after, source, source_id, description, metadata, expires_at, is_expired, created_at) FROM stdin;
\.
COPY public.marketing_campaigns (id, business_id, name, description, type, status, target_segment_id, subject, preheader_text, sender_name, sender_email, sender_phone, content, plain_text_content, scheduled_at, send_at, timezone, total_recipients, sent_count, delivered_count, opened_count, clicked_count, bounced_count, unsubscribed_count, spam_count, delivery_rate, open_rate, click_rate, conversion_rate, track_opens, track_clicks, allow_unsubscribe, test_mode, created_at, updated_at, sent_at, completed_at) FROM stdin;
\.
COPY public.marketing_workflows (id, business_id, name, description, trigger_type, trigger_config, steps, status, total_enrolled, active_enrollments, completed_enrollments, created_at, updated_at, activated_at) FROM stdin;
\.
COPY public.messages (id, sender_id, receiver_id, sender_business_id, receiver_business_id, content, message_type, file_url, file_name, file_type, file_size, shared_business_id, shared_product_id, is_read, read_at, is_delivered, delivered_at, conversation_id, networking_context, created_at, updated_at) FROM stdin;
\.
COPY public.order_items (id, order_id, product_id, product_name, product_price, quantity, total_price, created_at) FROM stdin;
\.
COPY public.orders (id, user_id, status, subtotal, tax_amount, shipping_amount, total, currency, shipping_address, billing_address, customer_email, customer_phone, notes, customer_comment, invoice_number, vendor_business_id, parent_order_id, created_at, updated_at) FROM stdin;
\.
COPY public.payments (id, order_id, stripe_payment_intent_id, stripe_client_secret, amount, currency, status, payment_method, failure_reason, paid_at, created_at, updated_at) FROM stdin;
\.
COPY public.post_comments (id, post_id, user_id, content, created_at, updated_at) FROM stdin;
\.
COPY public.post_likes (id, post_id, user_id, created_at) FROM stdin;
\.
COPY public.posts (id, business_id, content, images, type, like_count, comment_count, share_count, is_visible, created_at, updated_at) FROM stdin;
819ef740-88db-4d4d-8068-9133e9ca8184	0022ecec-a4d8-4170-88b9-9c407e390b65	Just deployed a lead generation system for a solar company that reduced their response time from 3 days to under 5 minutes. Result? Their close rate jumped from 8% to 23% in 90 days. This is what intelligent automation looks like. 🚀 #WorkflowAutomation #SalesOps	\N	achievement	156	24	0	t	2025-10-15 19:04:44.978404	2025-10-15 19:04:44.978404
12e95ff1-aba5-4ec6-bb16-af903eaf4fe3	0022ecec-a4d8-4170-88b9-9c407e390b65	Hot take: Your sales team doesn't need more reps. They need better automation. We just helped a 3-person team perform at 15-person capacity through smart workflows. The future of sales isn't bigger teams—it's smarter systems. 💡 #Automation #ScaleUp	\N	update	203	31	18	t	2025-10-15 19:04:44.978404	2025-10-15 19:04:44.978404
34289ff9-8343-44d3-8d11-dd2939bbe302	8e5b776b-492a-4a37-bc42-92f4901c2166	🎉 Another amazing cohort just crushed their 2-15 exam! 87% pass rate on FIRST attempt! Remember: #NeverHuntAlone. When you join The Insurance School family, you're joining a community of future insurance professionals who support each other every step of the way. Ready to start YOUR insurance career? Link in bio! 📚✨	\N	achievement	124	18	0	t	2025-10-15 19:04:44.978404	2025-10-15 19:04:44.978404
df8acefd-0c07-4657-af18-e79208037e0e	e7ba150e-8ad5-46d9-a331-97bd52ec0177	✨ NEW DROP ALERT ✨ Just listed these gorgeous Festival Fringe Earrings - perfect for all you free spirits heading to upcoming festivals! Each pair is handcrafted with love and attention to detail. Limited quantities available! Shop link in bio 🌙💫 #BohoStyle #HandmadeJewelry	\N	product	89	12	0	t	2025-10-15 19:04:44.978404	2025-10-15 19:04:44.978404
765de163-eae1-4bb1-b5d6-cfe852683b47	1c882f16-33c1-42a1-935d-ec51b408c48d	🎙️ INCREDIBLE show today! Had the honor of featuring three Central Florida veterans on our 'Heroes Always Welcome' segment. Their stories of service, sacrifice, and success in business will inspire you. Catch the full episode on our Facebook page. Thank you for your service! 🇺🇸 #TheTedShow #HeroesAlwaysWelcome	\N	update	342	47	28	t	2025-10-15 19:04:44.978404	2025-10-15 19:04:44.978404
f370e216-2ee6-4a07-aaa8-54ebb46a365b	0e896397-caa7-4887-beee-2510c396f11c	📊 Open Enrollment is just around the corner! As an independent MGA with 30+ years experience, I'm here to help you navigate your options across ALL major carriers. Don't settle for one-size-fits-all - get personalized coverage that actually fits YOUR needs. Schedule your free consultation today! ☎️ (305) 270-1990	\N	update	67	9	0	t	2025-10-15 19:04:44.978404	2025-10-15 19:04:44.978404
64d97487-d342-4405-8351-e356a5d338bc	9c769fa4-1f56-4ae8-b667-94ce8186a7d7	Just deployed a lead generation system for a solar company that reduced their response time from 3 days to under 5 minutes. Result? Their close rate jumped from 8% to 23% in 90 days. This is what intelligent automation looks like. 🚀 #WorkflowAutomation #SalesOps	\N	achievement	156	24	0	t	2025-10-15 19:51:48.56166	2025-10-15 19:51:48.56166
24511725-5d61-4bac-a2eb-354778115c7e	9c769fa4-1f56-4ae8-b667-94ce8186a7d7	Hot take: Your sales team doesn't need more reps. They need better automation. We just helped a 3-person team perform at 15-person capacity through smart workflows. The future of sales isn't bigger teams—it's smarter systems. 💡 #Automation #ScaleUp	\N	update	203	31	18	t	2025-10-15 19:51:48.56166	2025-10-15 19:51:48.56166
d0e55dd6-5ef1-4ce4-9adb-a8662ee058b1	e4d2f924-d953-49df-9e97-bc9878637909	🎉 Another amazing cohort just crushed their 2-15 exam! 87% pass rate on FIRST attempt! Remember: #NeverHuntAlone. When you join The Insurance School family, you're joining a community of future insurance professionals who support each other every step of the way. Ready to start YOUR insurance career? Link in bio! 📚✨	\N	achievement	124	18	0	t	2025-10-15 19:51:48.56166	2025-10-15 19:51:48.56166
3804bd2b-39e5-4d1e-ba4f-b017ab049a1a	92dd241d-db94-4eb6-a1c1-54f778f2056f	✨ NEW DROP ALERT ✨ Just listed these gorgeous Festival Fringe Earrings - perfect for all you free spirits heading to upcoming festivals! Each pair is handcrafted with love and attention to detail. Limited quantities available! Shop link in bio 🌙💫 #BohoStyle #HandmadeJewelry	\N	product	89	12	0	t	2025-10-15 19:51:48.56166	2025-10-15 19:51:48.56166
75f8d820-422e-416b-b30d-30edc6e75ea6	bd5c872b-8989-402a-b090-a7a887bffd28	🎙️ INCREDIBLE show today! Had the honor of featuring three Central Florida veterans on our 'Heroes Always Welcome' segment. Their stories of service, sacrifice, and success in business will inspire you. Catch the full episode on our Facebook page. Thank you for your service! 🇺🇸 #TheTedShow #HeroesAlwaysWelcome	\N	update	342	47	28	t	2025-10-15 19:51:48.56166	2025-10-15 19:51:48.56166
ebd2688d-e1b3-46e0-9c3f-9ca8f6986a67	36541438-bf16-4238-a56c-1581403d51cd	📊 Open Enrollment is just around the corner! As an independent MGA with 30+ years experience, I'm here to help you navigate your options across ALL major carriers. Don't settle for one-size-fits-all - get personalized coverage that actually fits YOUR needs. Schedule your free consultation today! ☎️ (305) 270-1990	\N	update	67	9	0	t	2025-10-15 19:51:48.56166	2025-10-15 19:51:48.56166
d958128f-8bdf-4c1b-a1b6-4889d6517422	0022ecec-a4d8-4170-88b9-9c407e390b65	Check out our amazing new collection\\! Three stunning pieces that showcase the best of our craftsmanship.	["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=800", "https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800"]	product	15	3	5	t	2025-10-16 19:41:38.013455	2025-10-16 19:41:38.013455
16fd57e0-318d-44f5-96b2-35e564551c28	1c882f16-33c1-42a1-935d-ec51b408c48d	Celebrating a major milestone\\! Our partnership with local artisans brings you these exclusive handcrafted items.	["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800", "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800", "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800"]	partnership	24	7	8	t	2025-10-16 19:41:52.897641	2025-10-16 19:41:52.897641
e281806a-8d41-4f0f-9e67-579740cee9c3	36541438-bf16-4238-a56c-1581403d51cd	We did it\\! Award-winning service recognized by the community. Thank you for your continued support\\!	["https://images.unsplash.com/photo-1567401893414-76b7b1e5a7a5?w=800", "https://images.unsplash.com/photo-1563453392212-326f5e854473?w=800", "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800"]	achievement	42	12	15	t	2025-10-16 19:41:52.897641	2025-10-16 19:41:52.897641
\.
COPY public.premium_ad_slots (id, company_name, tagline, image_url, is_premium, business_id, display_order, is_active, created_at, expires_at) FROM stdin;
\.
COPY public.premium_features (id, business_id, feature_type, showcase_id, name, description, start_date, end_date, price, status, is_paid, paid_at, created_at) FROM stdin;
\.
COPY public.product_metrics (id, product_id, date, views, unique_viewers, search_appearances, units_sold, revenue, orders_count, add_to_cart_count, checkout_count, purchase_count, likes_count, shares_count, stock_level, restock_count, metadata, created_at, updated_at) FROM stdin;
\.
COPY public.products (id, business_id, name, description, price, original_price, category, images, inventory, is_active, is_digital, tags, rating, review_count, created_at, updated_at) FROM stdin;
14841463-37be-4c36-a0da-8fd05f03cccc	0022ecec-a4d8-4170-88b9-9c407e390b65	Lead Generation Architecture Sprint	2-week intensive sprint to design and deploy your multi-channel lead generation system. Includes discovery workshop, workflow design, implementation, and training. Typical ROI: 300%+ in 90 days.	7500.00	\N	Automation Services	\N	10	t	t	["Lead Generation", "Automation", "Multi-Channel", "Outbound", "Sprint"]	5.00	42	2025-10-15 19:04:44.721225	2025-10-15 19:04:44.721225
3f953b5a-f4dd-40a6-a2e8-5e73a7cd9009	0022ecec-a4d8-4170-88b9-9c407e390b65	AI Voice Agent Development	Custom AI-powered voice qualification bot using ElevenLabs technology. Handles inbound qualification calls 24/7, books meetings, and routes hot leads to your team. Processes 1,000+ calls monthly.	12000.00	\N	AI Solutions	\N	5	t	t	["AI", "Voice Agent", "ElevenLabs", "Qualification", "24/7"]	5.00	28	2025-10-15 19:04:44.721225	2025-10-15 19:04:44.721225
e67daef2-4abf-40d7-9c30-f047be20eacf	0022ecec-a4d8-4170-88b9-9c407e390b65	Sales Automation Retainer	Monthly ongoing optimization and support for your automation infrastructure. Includes workflow maintenance, new feature development, performance optimization, and strategic consulting.	3500.00	\N	Monthly Retainer	\N	999	t	t	["Retainer", "Support", "Optimization", "Consulting", "Ongoing"]	4.90	67	2025-10-15 19:04:44.721225	2025-10-15 19:04:44.721225
348cc3d0-1e8d-4833-a2cc-ba382cb8c35a	8e5b776b-492a-4a37-bc42-92f4901c2166	2-15 PRIVATE Masterclass	Complete Health & Life Insurance licensing preparation with live state-authorized classes, on-demand replays, State Exam Keywords & Concept Glossary, and everything in our resource catalog. Multiple review sessions ensure you're exam-ready.	299.00	\N	Pre-Licensing Course	\N	999	t	t	["2-15 License", "Health Insurance", "Life Insurance", "Live Classes", "On-Demand"]	4.90	234	2025-10-15 19:04:44.773019	2025-10-15 19:04:44.773019
9c9fcfd2-779a-442f-ae00-4aa65ec837d9	8e5b776b-492a-4a37-bc42-92f4901c2166	iFast Broker ELITE Bundle	Complete package for launching your insurance career fast. Includes pre-licensing, exam prep, business setup guidance, and career launch resources.	497.00	\N	Career Launch Package	\N	999	t	t	["Career Launch", "Business Setup", "Complete Package"]	5.00	89	2025-10-15 19:04:44.773019	2025-10-15 19:04:44.773019
7a4e5b4d-2c70-4821-841c-6ddef348f0e1	8e5b776b-492a-4a37-bc42-92f4901c2166	Continuing Education Package	2-14, 2-15, 2-40, 2-20 CE Courses - Keep your license valid with guest speaker insights, breakout sessions, NO EXAMS, and 4 Hour Law & Ethics included.	149.00	\N	Continuing Education	\N	999	t	t	["CE", "Continuing Education", "License Renewal"]	4.80	156	2025-10-15 19:04:44.773019	2025-10-15 19:04:44.773019
bd769eb3-2844-440f-82b3-f900e80d8094	e7ba150e-8ad5-46d9-a331-97bd52ec0177	Bohemian Layered Necklace Set	Handcrafted multi-strand bohemian necklace featuring natural stones, vintage beads, and artisan metalwork. Each piece is unique and tells its own story.	48.00	\N	Jewelry	\N	12	t	f	["Boho", "Handmade", "Necklace", "Layered", "Natural Stones"]	5.00	47	2025-10-15 19:04:44.823599	2025-10-15 19:04:44.823599
1e301ec8-4596-4230-9fd4-c8bc61970f20	e7ba150e-8ad5-46d9-a331-97bd52ec0177	Festival Fringe Earrings	Eye-catching bohemian fringe earrings perfect for festivals and free spirits. Lightweight and comfortable for all-day wear.	32.00	\N	Jewelry	\N	18	t	f	["Boho", "Earrings", "Festival", "Fringe", "Handmade"]	4.90	63	2025-10-15 19:04:44.823599	2025-10-15 19:04:44.823599
f4c96fca-ea65-4797-b8d9-ebf2a9623ab2	e7ba150e-8ad5-46d9-a331-97bd52ec0177	Vintage Bohemian Bracelet Stack	Curated set of 5 handcrafted bracelets featuring vintage charms, natural stones, and artisan beads. Mix and match for your perfect boho look.	56.00	\N	Jewelry	\N	8	t	f	["Boho", "Bracelets", "Stack", "Vintage", "Artisan"]	5.00	28	2025-10-15 19:04:44.823599	2025-10-15 19:04:44.823599
44f29886-700b-4624-b0e9-25f124440ada	1c882f16-33c1-42a1-935d-ec51b408c48d	Guest Feature on The Ted Show	Feature your business on The Ted Show's daily Facebook Live broadcast. Reach thousands of engaged Central Florida followers and share your story with our community of leaders and entrepreneurs.	500.00	\N	Media & Promotion	\N	50	t	t	["Media", "Promotion", "Interview", "Facebook Live", "Exposure"]	5.00	178	2025-10-15 19:04:44.878803	2025-10-15 19:04:44.878803
6c535cf8-2b91-4c8d-ac74-31d309427590	1c882f16-33c1-42a1-935d-ec51b408c48d	VA Loan Consultation with Ted	Expert VA loan consultation with NMLS #945102 Ted Bogert. Over 30 years experience helping veterans and their families achieve homeownership. Personalized service from a dedicated veteran advocate.	0.00	\N	Mortgage Services	\N	999	t	f	["VA Loans", "Veterans", "Mortgage", "Consultation", "Free"]	5.00	342	2025-10-15 19:04:44.878803	2025-10-15 19:04:44.878803
decfad0a-b28f-4437-9730-6e8ee0a1c295	1c882f16-33c1-42a1-935d-ec51b408c48d	Professional Event Emcee Service	Book Ted Bogert as your professional emcee. High-energy, engaging host for conferences, business events, and community gatherings. Creates fun, memorable experiences for your audience.	1500.00	\N	Speaking & Events	\N	24	t	f	["Emcee", "Speaker", "Events", "Professional", "Entertainment"]	5.00	94	2025-10-15 19:04:44.878803	2025-10-15 19:04:44.878803
2bfba000-63c7-40c0-a3f6-912fccf2419e	0e896397-caa7-4887-beee-2510c396f11c	Individual Health Insurance Plan	Personalized health insurance coverage tailored to your needs. As an independent broker with 30+ years experience and MGA credentials, I represent YOUR interests first across all major carriers.	0.00	\N	Health Insurance	\N	999	t	f	["Health Insurance", "Individual", "ACA", "Consultation"]	5.00	287	2025-10-15 19:04:44.927678	2025-10-15 19:04:44.927678
1dfc5a46-93f8-4fd9-aed7-8734815e5e01	0e896397-caa7-4887-beee-2510c396f11c	Small Business Group Coverage	Comprehensive group health coverage for small businesses. General Liability, Employee Benefits, Worker's Comp, and PEO services through Schwabe Benefits Group.	0.00	\N	Business Insurance	\N	999	t	f	["Group Insurance", "Business", "Employee Benefits", "Small Business"]	4.90	156	2025-10-15 19:04:44.927678	2025-10-15 19:04:44.927678
7d94b99a-673b-4512-9c8d-811d2fbcbdd0	0e896397-caa7-4887-beee-2510c396f11c	Life & Annuity Insurance Consultation	Expert guidance on life insurance and annuity products. Protect your family's future and build retirement income with tailored solutions from a LUTCF professional.	0.00	\N	Life Insurance	\N	999	t	f	["Life Insurance", "Annuities", "Retirement", "LUTCF"]	5.00	198	2025-10-15 19:04:44.927678	2025-10-15 19:04:44.927678
f97fc988-3e25-4b2f-b210-bde3b08c7c78	9c769fa4-1f56-4ae8-b667-94ce8186a7d7	Lead Generation Architecture Sprint	2-week intensive sprint to design and deploy your multi-channel lead generation system. Includes discovery workshop, workflow design, implementation, and training. Typical ROI: 300%+ in 90 days.	7500.00	\N	Automation Services	\N	10	t	t	["Lead Generation", "Automation", "Multi-Channel", "Outbound", "Sprint"]	5.00	42	2025-10-15 19:51:48.306813	2025-10-15 19:51:48.306813
965197a4-0cbb-49ef-8a08-01aee4b782bc	9c769fa4-1f56-4ae8-b667-94ce8186a7d7	AI Voice Agent Development	Custom AI-powered voice qualification bot using ElevenLabs technology. Handles inbound qualification calls 24/7, books meetings, and routes hot leads to your team. Processes 1,000+ calls monthly.	12000.00	\N	AI Solutions	\N	5	t	t	["AI", "Voice Agent", "ElevenLabs", "Qualification", "24/7"]	5.00	28	2025-10-15 19:51:48.306813	2025-10-15 19:51:48.306813
04a9b03d-ad0a-4d8c-9288-b63c58d79fa7	9c769fa4-1f56-4ae8-b667-94ce8186a7d7	Sales Automation Retainer	Monthly ongoing optimization and support for your automation infrastructure. Includes workflow maintenance, new feature development, performance optimization, and strategic consulting.	3500.00	\N	Monthly Retainer	\N	999	t	t	["Retainer", "Support", "Optimization", "Consulting", "Ongoing"]	4.90	67	2025-10-15 19:51:48.306813	2025-10-15 19:51:48.306813
4853df83-b467-47ec-8db5-d1b105b071c5	e4d2f924-d953-49df-9e97-bc9878637909	2-15 PRIVATE Masterclass	Complete Health & Life Insurance licensing preparation with live state-authorized classes, on-demand replays, State Exam Keywords & Concept Glossary, and everything in our resource catalog. Multiple review sessions ensure you're exam-ready.	299.00	\N	Pre-Licensing Course	\N	999	t	t	["2-15 License", "Health Insurance", "Life Insurance", "Live Classes", "On-Demand"]	4.90	234	2025-10-15 19:51:48.358797	2025-10-15 19:51:48.358797
80e62620-c312-4194-95d5-209ef13427a6	e4d2f924-d953-49df-9e97-bc9878637909	iFast Broker ELITE Bundle	Complete package for launching your insurance career fast. Includes pre-licensing, exam prep, business setup guidance, and career launch resources.	497.00	\N	Career Launch Package	\N	999	t	t	["Career Launch", "Business Setup", "Complete Package"]	5.00	89	2025-10-15 19:51:48.358797	2025-10-15 19:51:48.358797
4a289566-63f8-472f-9784-5d49c8973567	e4d2f924-d953-49df-9e97-bc9878637909	Continuing Education Package	2-14, 2-15, 2-40, 2-20 CE Courses - Keep your license valid with guest speaker insights, breakout sessions, NO EXAMS, and 4 Hour Law & Ethics included.	149.00	\N	Continuing Education	\N	999	t	t	["CE", "Continuing Education", "License Renewal"]	4.80	156	2025-10-15 19:51:48.358797	2025-10-15 19:51:48.358797
eff72408-8683-4f48-929f-020f2803a1fe	92dd241d-db94-4eb6-a1c1-54f778f2056f	Bohemian Layered Necklace Set	Handcrafted multi-strand bohemian necklace featuring natural stones, vintage beads, and artisan metalwork. Each piece is unique and tells its own story.	48.00	\N	Jewelry	\N	12	t	f	["Boho", "Handmade", "Necklace", "Layered", "Natural Stones"]	5.00	47	2025-10-15 19:51:48.410657	2025-10-15 19:51:48.410657
8baa899d-a115-4f3e-b18d-790543f85294	92dd241d-db94-4eb6-a1c1-54f778f2056f	Festival Fringe Earrings	Eye-catching bohemian fringe earrings perfect for festivals and free spirits. Lightweight and comfortable for all-day wear.	32.00	\N	Jewelry	\N	18	t	f	["Boho", "Earrings", "Festival", "Fringe", "Handmade"]	4.90	63	2025-10-15 19:51:48.410657	2025-10-15 19:51:48.410657
483ef99c-b93a-4538-90a2-f9b814404893	92dd241d-db94-4eb6-a1c1-54f778f2056f	Vintage Bohemian Bracelet Stack	Curated set of 5 handcrafted bracelets featuring vintage charms, natural stones, and artisan beads. Mix and match for your perfect boho look.	56.00	\N	Jewelry	\N	8	t	f	["Boho", "Bracelets", "Stack", "Vintage", "Artisan"]	5.00	28	2025-10-15 19:51:48.410657	2025-10-15 19:51:48.410657
f7c9d1b7-591b-4608-b1ba-3ffdbc87b12a	bd5c872b-8989-402a-b090-a7a887bffd28	Guest Feature on The Ted Show	Feature your business on The Ted Show's daily Facebook Live broadcast. Reach thousands of engaged Central Florida followers and share your story with our community of leaders and entrepreneurs.	500.00	\N	Media & Promotion	\N	50	t	t	["Media", "Promotion", "Interview", "Facebook Live", "Exposure"]	5.00	178	2025-10-15 19:51:48.46013	2025-10-15 19:51:48.46013
fc755e06-240b-4053-9925-4a892a254285	bd5c872b-8989-402a-b090-a7a887bffd28	VA Loan Consultation with Ted	Expert VA loan consultation with NMLS #945102 Ted Bogert. Over 30 years experience helping veterans and their families achieve homeownership. Personalized service from a dedicated veteran advocate.	0.00	\N	Mortgage Services	\N	999	t	f	["VA Loans", "Veterans", "Mortgage", "Consultation", "Free"]	5.00	342	2025-10-15 19:51:48.46013	2025-10-15 19:51:48.46013
2cbb722b-4a1a-44ef-8da6-b91a706d3b81	bd5c872b-8989-402a-b090-a7a887bffd28	Professional Event Emcee Service	Book Ted Bogert as your professional emcee. High-energy, engaging host for conferences, business events, and community gatherings. Creates fun, memorable experiences for your audience.	1500.00	\N	Speaking & Events	\N	24	t	f	["Emcee", "Speaker", "Events", "Professional", "Entertainment"]	5.00	94	2025-10-15 19:51:48.46013	2025-10-15 19:51:48.46013
3a5e4b67-69df-438d-8a70-a15caec40141	36541438-bf16-4238-a56c-1581403d51cd	Individual Health Insurance Plan	Personalized health insurance coverage tailored to your needs. As an independent broker with 30+ years experience and MGA credentials, I represent YOUR interests first across all major carriers.	0.00	\N	Health Insurance	\N	999	t	f	["Health Insurance", "Individual", "ACA", "Consultation"]	5.00	287	2025-10-15 19:51:48.509475	2025-10-15 19:51:48.509475
7ed262b4-1ee4-4577-bd14-3f2b8a167a97	36541438-bf16-4238-a56c-1581403d51cd	Small Business Group Coverage	Comprehensive group health coverage for small businesses. General Liability, Employee Benefits, Worker's Comp, and PEO services through Schwabe Benefits Group.	0.00	\N	Business Insurance	\N	999	t	f	["Group Insurance", "Business", "Employee Benefits", "Small Business"]	4.90	156	2025-10-15 19:51:48.509475	2025-10-15 19:51:48.509475
ec571006-4bd9-428a-bd8b-dcb4138a2660	36541438-bf16-4238-a56c-1581403d51cd	Life & Annuity Insurance Consultation	Expert guidance on life insurance and annuity products. Protect your family's future and build retirement income with tailored solutions from a LUTCF professional.	0.00	\N	Life Insurance	\N	999	t	f	["Life Insurance", "Annuities", "Retirement", "LUTCF"]	5.00	198	2025-10-15 19:51:48.509475	2025-10-15 19:51:48.509475
\.
COPY public.rate_limit_records (id, identifier, limit_type, attempts, window_start, window_end, blocked, blocked_until, metadata, created_at, updated_at) FROM stdin;
\.
COPY public.rate_limit_violations (id, identifier, ip_address, user_id, endpoint, violation_type, request_count, time_window, penalty, penalty_duration, metadata, resolved, resolved_at, created_at) FROM stdin;
\.
COPY public.recent_purchases (id, order_id, customer_name, customer_location, product_name, vendor_name, vendor_business_id, customer_comment, amount, is_visible, created_at) FROM stdin;
\.
COPY public.referrals (id, referrer_id, referee_id, referral_code, email, status, referrer_reward_points, referee_reward_points, referrer_rewarded, referee_rewarded, referee_first_purchase_at, metadata, created_at, signed_up_at, completed_at) FROM stdin;
\.
COPY public.reward_redemptions (id, user_id, reward_id, transaction_id, points_spent, status, redemption_code, redeemed_at, fulfilled_at, expires_at, order_id, metadata, created_at, updated_at) FROM stdin;
\.
COPY public.rewards (id, business_id, name, description, image_url, points_cost, reward_type, reward_value, discount_type, discount_amount, product_id, category, terms_conditions, stock_quantity, max_redemptions_per_user, valid_from, valid_until, is_active, is_featured, tier_restriction, redemption_count, created_at, updated_at) FROM stdin;
\.
COPY public.security_events (id, event_type, severity, user_id, ip_address, user_agent, description, metadata, resolved, resolved_at, resolved_by, notification_sent, created_at) FROM stdin;
\.
COPY public.security_notifications (id, recipient_email, recipient_phone, notification_type, subject, message, priority, metadata, status, attempts, sent_at, failure_reason, created_at) FROM stdin;
\.
COPY public.segment_members (id, segment_id, user_id, added_at, source) FROM stdin;
\.
COPY public.session_events (id, session_id, user_id, event_type, ip_address, user_agent, location, metadata, severity, created_at) FROM stdin;
\.
COPY public.sessions (sid, sess, expire) FROM stdin;
70c5498f7cf5bfaf11940de97791a6aba4a9a99d7693cf5f00845b353d4db8f2	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-22T21:39:07.471Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "OIGJjaUGNlzAGEX-0hMLqdCJ_6uwMJoawv4E1W0zljA"}}	2025-10-22 21:39:08
e0ddc7da928a01ec00ee62924ffd81551584c79299d748b9f6057652907af28c	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-23T00:03:22.751Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "replit.com": {"code_verifier": "6y4o4rNYKutnKsNqD_VIi2o8J-QPGpShbB_rxOGk_3k"}}	2025-10-23 00:03:23
38a8a4ae8d520542f8985b3dd6f6a10ef3a4fe2ff0e3bf8bab064374cdfa3b52	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-22T19:22:55.492Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "37b162fe-06a2-4d36-87ae-cfe2b74a00f2", "exp": 1760559775, "iat": 1760556175, "iss": "https://replit.com/oidc", "sub": "admin-rob-fusion", "email": "rob@fusiondataco.com", "at_hash": "2zh34S3_3GIYHnROubY4Tg", "username": "FusionDataCo", "auth_time": 1760556173, "last_name": "Yeager", "first_name": "Robert"}, "expires_at": 1760559775, "access_token": "0lm6O1E80uNOtJd1f11Wbno_2KOz_AJ-GvIKSSFoUEm", "refresh_token": "OdPWW4AMntKSFbJisqcFhkyMY5-ZTC7kM1fcsH-L7Uf"}}}	2025-10-22 20:08:07
fb78351f61ca6a5f0a7f709673a68dc1936eca37b6cf89e41c87e323e5266e96	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-22T22:00:41.983Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604799999}, "replit.com": {"code_verifier": "QPbMbaqsLeTCsm9xQ9fegQ7d3R8ssgSnOswkZvpkhVM"}}	2025-10-22 22:00:42
92817cacf952d3bf9f32fd4565b4bb41fb3d677959d9df66abf60350606e3cd1	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-24T14:55:39.412Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "37b162fe-06a2-4d36-87ae-cfe2b74a00f2", "exp": 1760716539, "iat": 1760712939, "iss": "https://replit.com/oidc", "sub": "39061945", "email": "rob@fusiondataco.com", "at_hash": "Uuhw5fKTKjl-5TWdwVvf-w", "username": "FusionDataCo", "auth_time": 1760682041, "last_name": "Yeager", "first_name": "Robert"}, "expires_at": 1760716539, "access_token": "u4fUKm0lXNHbHCYmIlBy12rxk7NuxeyNccci2Py2dYk", "refresh_token": "pfcI4tL1dxyPxW0ysM7yHJOiZ3X4zDB_92phbGM6JOX"}}}	2025-10-24 15:25:44
4bcf242921108c782890ae68e8cfccd6f822cf093f120d3321048563fdc6ceec	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-23T00:33:48.967Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "37b162fe-06a2-4d36-87ae-cfe2b74a00f2", "exp": 1760578428, "iat": 1760574828, "iss": "https://replit.com/oidc", "sub": "39061945", "email": "rob@fusiondataco.com", "at_hash": "GlQRL8qzUZkkxSWawzIP1g", "username": "FusionDataCo", "auth_time": 1760571216, "last_name": "Yeager", "first_name": "Robert"}, "expires_at": 1760578428, "access_token": "4SeFu1QFwy41JZaCnXsSt6vMUzsjsoJZu03k1Z_EjDx", "refresh_token": "nvXL8nP82pP7BTgrMluW2s8iNo_N56scPY933TzMtdl"}}}	2025-10-23 00:36:44
d48e3a4014ba280e9938cbd03503e1da8f3ff94aab0a60d5018d3c3578987fab	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-23T18:05:49.334Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "37b162fe-06a2-4d36-87ae-cfe2b74a00f2", "exp": 1760641549, "iat": 1760637949, "iss": "https://replit.com/oidc", "sub": "admin-rob-fusion", "email": "rob@fusiondataco.com", "at_hash": "gBenOgqXI0AiFTPBX47mLA", "username": "FusionDataCo", "auth_time": 1760637948, "last_name": "Yeager", "first_name": "Robert"}, "expires_at": 1760641549, "access_token": "siA_a9OetSNfNyHk4uaRdnINJPdlfsZRCka0IopAZuB", "refresh_token": "7JthdkUb5-b1ZO-wbrYPGxXfQuD0t1FsvAlDvR-ONdM"}}}	2025-10-23 18:23:31
1fb28ef761790ab701473bc4fcb46a504803c184bf86b9775690e7c0ff0605e3	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-23T20:13:36.117Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "37b162fe-06a2-4d36-87ae-cfe2b74a00f2", "exp": 1760649215, "iat": 1760645615, "iss": "https://replit.com/oidc", "sub": "admin-mat-fusion", "email": "mat@fusiondataco.com", "at_hash": "SkbBvwR-KO0ApXKHetD79g", "username": "mat102", "auth_time": 1760645615, "last_name": "mercado", "first_name": "mat"}, "expires_at": 1760649215, "access_token": "Iqi1ETYDp23BWhjo0d5iwrT1W9FqERkWA6_db28NK9z", "refresh_token": "j-HEn3MJoYo5WGMlaUK_wtXd8Xui83XILcqWBtRLw0l"}}}	2025-10-23 20:40:43
44894d8bf25da18f88dcd409a12bbb665b357e13c9679894e7bf44502f51ecc2	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-22T21:02:29.044Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "37b162fe-06a2-4d36-87ae-cfe2b74a00f2", "exp": 1760565748, "iat": 1760562148, "iss": "https://replit.com/oidc", "sub": "44038657", "email": "mat@fusiondataco.com", "at_hash": "WIGYV5BYXlx_Jb1kaZyMFA", "username": "mat102", "auth_time": 1760557337, "last_name": "mercado", "first_name": "mat"}, "expires_at": 1760565748, "access_token": "SBberBmuDdorgsboNxOLRuxJ0il0mLlRQN6VDwiuvXl", "refresh_token": "rQaxwRHNeJW915yv-35ZezKE4ZrphyYafkf7HLUKWXq"}}}	2025-10-22 21:19:35
7764fdfdb9a5ef8febd2944780ef64cbd04419dbe698714a55c0f88ee569ea8c	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-24T15:39:44.236Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "37b162fe-06a2-4d36-87ae-cfe2b74a00f2", "exp": 1760719183, "iat": 1760715583, "iss": "https://test-mock-oidc.replit.app/", "jti": "62cd1c8850c0f566f01faae5062cd325", "sub": "admin_nI4p-a", "email": "admin_nI4p-a@example.com", "roles": ["admin"], "auth_time": 1760715583, "last_name": "User", "first_name": "Admin"}, "expires_at": 1760719183, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYwNzE1NTgzLCJleHAiOjE3NjA3MTkxODMsInN1YiI6ImFkbWluX25JNHAtYSIsImVtYWlsIjoiYWRtaW5fbkk0cC1hQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IkFkbWluIiwibGFzdF9uYW1lIjoiVXNlciIsInJvbGVzIjpbImFkbWluIl19.P05uqvJJZn9CbQU9fS5yFK510IYEimj0l3iDblABx62YXTEqzJM_Gm1TKTszr8DzGGV-4jWkvbJcd1kEkOE-oor8GuwoBVsth26WllKWV3_uQeQh7eelAlxc7_rwndvdkMB5qUlQnFRRBhK0Ykh44gcexZfv6_8E1vheRbbLEi8lntwEHr5iGGcFQUJouF0OQXASD6DN1gsj9JmM0YXaVGGqfAFko3DLDjRRJQkRFIa5rGyaKj23nxMvafw8df86uu3BORsAHpA6JXLU6ni6glzDwdr6dqzYcCaiic62hHuwTvJceZCyhV8otskN6vlDSbBqCHLUWkvD0CGPYTg8xw", "refresh_token": "eyJzdWIiOiJhZG1pbl9uSTRwLWEiLCJlbWFpbCI6ImFkbWluX25JNHAtYUBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJBZG1pbiIsImxhc3RfbmFtZSI6IlVzZXIiLCJyb2xlcyI6WyJhZG1pbiJdfQ"}}}	2025-10-24 15:39:51
ab93e67bca6814e7df2cbd5c2ea8b7fc9581512d511280407a5844421ff98045	{"cookie": {"path": "/", "secure": false, "expires": "2025-10-24T15:37:04.994Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": {"claims": {"aud": "37b162fe-06a2-4d36-87ae-cfe2b74a00f2", "exp": 1760719024, "iat": 1760715424, "iss": "https://test-mock-oidc.replit.app/", "jti": "7c0fa601f7cd84db147714f5d037e208", "sub": "1qJACX", "email": "1qJACX@example.com", "auth_time": 1760715424, "last_name": "Doe", "first_name": "John"}, "expires_at": 1760719024, "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ijc4MDgyZTlmZjVhOTA1YjIifQ.eyJpc3MiOiJodHRwczovL3Rlc3QtbW9jay1vaWRjLnJlcGxpdC5hcHAvIiwiaWF0IjoxNzYwNzE1NDI0LCJleHAiOjE3NjA3MTkwMjQsInN1YiI6IjFxSkFDWCIsImVtYWlsIjoiMXFKQUNYQGV4YW1wbGUuY29tIiwiZmlyc3RfbmFtZSI6IkpvaG4iLCJsYXN0X25hbWUiOiJEb2UifQ.aMqcYSUy8Eb5BR7n5E4CUwbK5jOJSku5uzNZRwLurAFlrdvGLXe-wPECXhRjAMfYx3HfEJWvV3CMbFveaB56mwZWLxJBXhNfJroUVTI3PYidtbTmxaaI8XL7BXWD2UDkkHhJ8Pbm2v3wXeaHVAW6FPdc1yE0fgL5PvimsIV4RAeMhlgS9M0Hg4Aq-_zC8xm7P9RJ_87L3Y_lz2bdTR3HHHPbjQbIUQvCmWDquRtEM2ETPWavtUxfM3GzSSyNPeSdXNsE2I1gEukxjB5fHUqqcKWG10C4b7C3uIHaL6Hw0_pzRdOCfuJSqWsUAyyWMD_2w8YwMfPKVqsPmUkh337HLA", "refresh_token": "eyJzdWIiOiIxcUpBQ1giLCJlbWFpbCI6IjFxSkFDWEBleGFtcGxlLmNvbSIsImZpcnN0X25hbWUiOiJKb2huIiwibGFzdF9uYW1lIjoiRG9lIn0"}}}	2025-10-24 15:38:15
\.
COPY public.social_accounts (id, user_id, business_id, platform, account_id, account_name, account_handle, profile_url, profile_image_url, is_active, metadata, last_synced_at, created_at, updated_at) FROM stdin;
\.
COPY public.social_analytics (id, social_account_id, business_id, platform, date, metrics, insights, created_at) FROM stdin;
\.
COPY public.social_content_categories (id, business_id, name, color, icon, description, post_count, is_active, created_at, updated_at) FROM stdin;
\.
COPY public.social_media_accounts (id, business_id, user_id, platform, account_type, account_id, account_name, account_handle, profile_url, profile_image_url, access_token, refresh_token, token_expiry, token_scopes, is_active, is_verified, last_sync_at, last_error_at, last_error, platform_metadata, created_at, updated_at) FROM stdin;
\.
COPY public.social_media_analytics (id, post_id, account_id, business_id, platform, metric_date, metric_type, impressions, reach, engagements, likes, comments, shares, saves, clicks, video_views, video_completions, follower_count, follower_growth, audience_demographics, engagement_rate, click_through_rate, conversion_rate, cost_per_engagement, conversions, revenue, created_at) FROM stdin;
\.
COPY public.social_media_automation (id, business_id, name, type, trigger_type, trigger_config, action_type, action_config, platforms, is_active, last_triggered_at, trigger_count, created_at, updated_at) FROM stdin;
\.
COPY public.social_media_campaigns (id, business_id, created_by, name, description, objectives, start_date, end_date, budget, spent_budget, target_audience, target_platforms, status, post_count, total_impressions, total_engagements, total_conversions, total_revenue, created_at, updated_at) FROM stdin;
\.
COPY public.social_media_listeners (id, business_id, name, type, keywords, hashtags, accounts, platforms, alert_enabled, alert_threshold, alert_emails, is_active, last_checked_at, created_at, updated_at) FROM stdin;
\.
COPY public.social_media_mentions (id, listener_id, business_id, platform, platform_post_id, author_name, author_handle, author_profile_url, content, post_url, sentiment, reach, engagement, is_influencer, influencer_score, responded, responded_at, mentioned_at, created_at) FROM stdin;
\.
COPY public.social_media_messages (id, business_id, account_id, platform, platform_message_id, message_type, sender_name, sender_id, sender_profile_url, is_from_business, content, media_urls, parent_message_id, thread_id, status, priority, sentiment, assigned_to, replied_at, response_time, auto_response_sent, auto_response_template, created_at, updated_at) FROM stdin;
\.
COPY public.social_media_posts (id, business_id, author_id, content, content_type, media_urls, thumbnail_url, hashtags, mentions, links, status, scheduled_at, published_at, platforms, platform_posts, campaign_id, category_id, is_promoted, promotion_budget, needs_approval, approved_by, approved_at, approval_notes, created_at, updated_at) FROM stdin;
\.
COPY public.social_media_team (id, business_id, user_id, role, permissions, can_publish, can_schedule, can_respond, can_view_analytics, can_manage_team, assigned_platforms, is_active, invited_by, created_at, updated_at) FROM stdin;
\.
COPY public.social_posts (id, social_account_id, business_id, platform_post_id, platform, post_type, content, media_urls, hashtags, mentions, scheduled_for, published_at, status, metrics, metadata, created_at, updated_at) FROM stdin;
\.
COPY public.social_response_templates (id, business_id, name, category, content, platforms, triggers, use_count, is_active, created_at, updated_at) FROM stdin;
\.
COPY public.social_tokens (id, social_account_id, access_token, refresh_token, expires_at, scopes, created_at, updated_at) FROM stdin;
\.
COPY public.spotlight_history (id, business_id, type, "position", start_date, end_date, engagement_score, quality_score, recency_score, diversity_score, total_score, created_at) FROM stdin;
cafd725d-6f21-4155-aeae-2e996a9367e7	0022ecec-a4d8-4170-88b9-9c407e390b65	daily	1	2025-10-15 19:05:22.618	2025-10-16 19:05:22.618	\N	\N	\N	\N	55.00	2025-10-15 19:05:22.702719
672f52e3-c73f-4450-8926-5dce42ee0df3	8e5b776b-492a-4a37-bc42-92f4901c2166	weekly	1	2025-10-15 19:06:52.113	2025-10-22 19:06:52.113	\N	\N	\N	\N	55.00	2025-10-15 19:06:52.195326
c06d3ac7-de6f-442b-8d14-1fa60ea3c38f	e7ba150e-8ad5-46d9-a331-97bd52ec0177	monthly	1	2025-10-15 19:09:14.144	2025-11-15 19:09:14.144	\N	\N	\N	\N	16.50	2025-10-15 19:09:14.228204
036235ee-b40a-4769-81b7-f5ab30665d56	1c882f16-33c1-42a1-935d-ec51b408c48d	daily	1	2025-10-16 15:07:07.865	2025-10-17 15:07:07.865	\N	\N	\N	\N	55.00	2025-10-16 15:07:07.935585
46fa69fa-84e7-496a-8045-e8416d222728	0e896397-caa7-4887-beee-2510c396f11c	daily	1	2025-10-17 12:17:09.25	2025-10-18 12:17:09.25	\N	\N	\N	\N	55.00	2025-10-17 12:17:09.323651
\.
COPY public.spotlight_votes (id, business_id, user_id, month, created_at) FROM stdin;
\.
COPY public.spotlights (id, business_id, type, "position", start_date, end_date, is_active, created_at) FROM stdin;
77b104eb-db93-45ae-8701-ab75a6781720	8e5b776b-492a-4a37-bc42-92f4901c2166	weekly	1	2025-10-15 19:06:52.113	2025-10-22 19:06:52.113	t	2025-10-15 19:06:52.139308
e19de7d3-20e4-4326-8564-4bbd7e4bc097	e7ba150e-8ad5-46d9-a331-97bd52ec0177	monthly	1	2025-10-15 19:09:14.144	2025-11-15 19:09:14.144	t	2025-10-15 19:09:14.170681
55602c58-4399-403a-822f-fbd62de33952	0022ecec-a4d8-4170-88b9-9c407e390b65	daily	1	2025-10-15 19:05:22.618	2025-10-16 19:05:22.618	f	2025-10-15 19:05:22.645713
dacd77c3-db8e-494e-a41c-1d24caad331f	0e896397-caa7-4887-beee-2510c396f11c	daily	1	2025-10-17 12:17:09.25	2025-10-18 12:17:09.25	t	2025-10-17 12:17:09.273796
134c22f5-640d-409b-89f9-9b41adec7768	1c882f16-33c1-42a1-935d-ec51b408c48d	daily	1	2025-10-16 15:07:07.865	2025-10-17 15:07:07.865	f	2025-10-16 15:07:07.885562
\.
COPY public.timeline_showcase_votes (id, showcase_id, user_id, vote_type, created_at) FROM stdin;
\.
COPY public.timeline_showcases (id, entrepreneur_id, business_id, author_id, type, title, content, excerpt, media_urls, cta_text, cta_url, tags, category, vote_count, like_count, comment_count, share_count, view_count, is_pinned, is_featured, is_promoted, promotion_spot_id, promotion_start_date, promotion_end_date, is_approved, approved_by, approved_at, scheduled_at, published_at, is_published, created_at, updated_at) FROM stdin;
\.
COPY public.user_metrics (id, user_id, date, page_views, session_duration, actions_count, orders_placed, total_spent, reviews_written, messages_sent, social_shares, points_earned, points_spent, rewards_redeemed, metadata, created_at, updated_at) FROM stdin;
\.
COPY public.user_roles (id, user_id, role_id, assigned_by, assigned_at) FROM stdin;
\.
COPY public.user_sessions (id, user_id, token, ip_address, user_agent, device_id, location, last_activity, expires_at, is_active, created_at) FROM stdin;
\.
COPY public.users (id, email, first_name, last_name, profile_image_url, is_admin, online_status, last_seen_at, created_at, updated_at) FROM stdin;
elite-jason-perez	theinsuranceschool@gmail.com	Jason	Perez	\N	f	offline	\N	2025-10-15 19:04:43.891805	2025-10-15 19:51:47.456
elite-kelli-kirk	kelli@bohohooligan.com	Kelli	Kirk	\N	f	offline	\N	2025-10-15 19:04:44.096658	2025-10-15 19:51:47.66
elite-ted-bogert	ted@thetedshow.com	Ted	Bogert	\N	f	offline	\N	2025-10-15 19:04:44.312785	2025-10-15 19:51:47.858
elite-neil-schwabe	neil@schwabebenefitsgroup.com	Neil	Schwabe	\N	f	offline	\N	2025-10-15 19:04:44.515741	2025-10-15 19:51:48.064
admin-mat-fusion	mat@fusiondataco.com	mat	mercado	\N	t	offline	2025-10-16 20:40:46.261	2025-10-15 19:04:43.578872	2025-10-16 20:40:46.261
admin-rob-fusion	rob@fusiondataco.com	Robert	Yeager	\N	t	offline	2025-10-17 06:48:24.032	2025-10-15 19:04:43.518466	2025-10-17 06:48:24.032
1qJACX	1qJACX@example.com	John	Doe	\N	f	offline	2025-10-17 15:37:47.544	2025-10-17 15:37:04.687586	2025-10-17 15:37:47.544
admin_nI4p-a	admin_nI4p-a@example.com	Admin	User	\N	f	offline	\N	2025-10-17 15:39:44.010355	2025-10-17 15:39:44.010355
\.
COPY public.vendor_transactions (id, business_id, order_id, amount, platform_fee, vendor_payout, currency, stripe_transfer_id, stripe_charge_id, payment_processor, status, failure_reason, paid_out_at, refunded_at, created_at) FROM stdin;
\.
COPY public.workflow_enrollments (id, workflow_id, user_id, status, current_step_id, current_step_started_at, enrolled_at, completed_at, exited_at, exit_reason, enrollment_data) FROM stdin;
\.
COPY public.workflow_step_logs (id, enrollment_id, workflow_id, step_id, step_type, status, started_at, completed_at, error_message, result) FROM stdin;
\.
ALTER TABLE ONLY public.account_lockouts
    ADD CONSTRAINT account_lockouts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_session_id_unique UNIQUE (session_id);
ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ad_spots
    ADD CONSTRAINT ad_spots_name_unique UNIQUE (name);
ALTER TABLE ONLY public.ad_spots
    ADD CONSTRAINT ad_spots_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_name_unique UNIQUE (name);
ALTER TABLE ONLY public.admin_roles
    ADD CONSTRAINT admin_roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ai_content_templates
    ADD CONSTRAINT ai_content_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ai_content_tests
    ADD CONSTRAINT ai_content_tests_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ai_generated_content
    ADD CONSTRAINT ai_generated_content_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ai_generated_images
    ADD CONSTRAINT ai_generated_images_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ai_moderation_log
    ADD CONSTRAINT ai_moderation_log_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ai_usage_tracking
    ADD CONSTRAINT ai_usage_tracking_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_key_hash_unique UNIQUE (key_hash);
ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.auth_audit_logs
    ADD CONSTRAINT auth_audit_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_analytics
    ADD CONSTRAINT blog_analytics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_bookmarks
    ADD CONSTRAINT blog_bookmarks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_name_unique UNIQUE (name);
ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_categories
    ADD CONSTRAINT blog_categories_slug_unique UNIQUE (slug);
ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_slug_unique UNIQUE (slug);
ALTER TABLE ONLY public.blog_reactions
    ADD CONSTRAINT blog_reactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_reading_lists
    ADD CONSTRAINT blog_reading_lists_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_revisions
    ADD CONSTRAINT blog_revisions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_subscriptions
    ADD CONSTRAINT blog_subscriptions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_subscriptions
    ADD CONSTRAINT blog_subscriptions_unsubscribe_token_unique UNIQUE (unsubscribe_token);
ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_name_unique UNIQUE (name);
ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.blog_tags
    ADD CONSTRAINT blog_tags_slug_unique UNIQUE (slug);
ALTER TABLE ONLY public.business_followers
    ADD CONSTRAINT business_followers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.business_metrics
    ADD CONSTRAINT business_metrics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.campaign_clicks
    ADD CONSTRAINT campaign_clicks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.campaign_links
    ADD CONSTRAINT campaign_links_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.campaign_links
    ADD CONSTRAINT campaign_links_short_code_unique UNIQUE (short_code);
ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chat_analytics
    ADD CONSTRAINT chat_analytics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chat_knowledge_base
    ADD CONSTRAINT chat_knowledge_base_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chat_knowledge_base
    ADD CONSTRAINT chat_knowledge_base_slug_unique UNIQUE (slug);
ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chat_proactive_triggers
    ADD CONSTRAINT chat_proactive_triggers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chat_quick_actions
    ADD CONSTRAINT chat_quick_actions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_session_id_unique UNIQUE (session_id);
ALTER TABLE ONLY public.conversion_funnels
    ADD CONSTRAINT conversion_funnels_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.customer_cohorts
    ADD CONSTRAINT customer_cohorts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.customer_segments
    ADD CONSTRAINT customer_segments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.daily_metrics
    ADD CONSTRAINT daily_metrics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.device_fingerprints
    ADD CONSTRAINT device_fingerprints_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.engagement_metrics
    ADD CONSTRAINT engagement_metrics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.entrepreneur_businesses
    ADD CONSTRAINT entrepreneur_businesses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.entrepreneurs
    ADD CONSTRAINT entrepreneurs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.entrepreneurs
    ADD CONSTRAINT entrepreneurs_user_id_unique UNIQUE (user_id);
ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.failed_login_attempts
    ADD CONSTRAINT failed_login_attempts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.geo_restrictions
    ADD CONSTRAINT geo_restrictions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.gmb_reviews
    ADD CONSTRAINT gmb_reviews_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.gmb_sync_history
    ADD CONSTRAINT gmb_sync_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.gmb_tokens
    ADD CONSTRAINT gmb_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.ip_access_control
    ADD CONSTRAINT ip_access_control_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lead_capture_forms
    ADD CONSTRAINT lead_capture_forms_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.lead_submissions
    ADD CONSTRAINT lead_submissions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_user_id_unique UNIQUE (user_id);
ALTER TABLE ONLY public.loyalty_rules
    ADD CONSTRAINT loyalty_rules_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.loyalty_tiers
    ADD CONSTRAINT loyalty_tiers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.marketing_campaigns
    ADD CONSTRAINT marketing_campaigns_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.marketing_workflows
    ADD CONSTRAINT marketing_workflows_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_stripe_payment_intent_id_unique UNIQUE (stripe_payment_intent_id);
ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.premium_ad_slots
    ADD CONSTRAINT premium_ad_slots_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.premium_features
    ADD CONSTRAINT premium_features_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.product_metrics
    ADD CONSTRAINT product_metrics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rate_limit_records
    ADD CONSTRAINT rate_limit_records_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.rate_limit_violations
    ADD CONSTRAINT rate_limit_violations_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.recent_purchases
    ADD CONSTRAINT recent_purchases_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referral_code_unique UNIQUE (referral_code);
ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_redemption_code_unique UNIQUE (redemption_code);
ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.security_notifications
    ADD CONSTRAINT security_notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.segment_members
    ADD CONSTRAINT segment_members_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.session_events
    ADD CONSTRAINT session_events_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);
ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_analytics
    ADD CONSTRAINT social_analytics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_content_categories
    ADD CONSTRAINT social_content_categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_media_accounts
    ADD CONSTRAINT social_media_accounts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_media_analytics
    ADD CONSTRAINT social_media_analytics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_media_automation
    ADD CONSTRAINT social_media_automation_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_media_campaigns
    ADD CONSTRAINT social_media_campaigns_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_media_listeners
    ADD CONSTRAINT social_media_listeners_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_media_mentions
    ADD CONSTRAINT social_media_mentions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_media_messages
    ADD CONSTRAINT social_media_messages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_media_posts
    ADD CONSTRAINT social_media_posts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_media_team
    ADD CONSTRAINT social_media_team_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_posts
    ADD CONSTRAINT social_posts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_response_templates
    ADD CONSTRAINT social_response_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.social_tokens
    ADD CONSTRAINT social_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.spotlight_history
    ADD CONSTRAINT spotlight_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.spotlight_votes
    ADD CONSTRAINT spotlight_votes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.spotlights
    ADD CONSTRAINT spotlights_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.timeline_showcase_votes
    ADD CONSTRAINT timeline_showcase_votes_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.timeline_showcases
    ADD CONSTRAINT timeline_showcases_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_metrics
    ADD CONSTRAINT user_metrics_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_token_unique UNIQUE (token);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);
ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.vendor_transactions
    ADD CONSTRAINT vendor_transactions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.workflow_enrollments
    ADD CONSTRAINT workflow_enrollments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.workflow_step_logs
    ADD CONSTRAINT workflow_step_logs_pkey PRIMARY KEY (id);
CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);
CREATE INDEX analytics_events_business_idx ON public.analytics_events USING btree (business_id);
CREATE INDEX analytics_events_timestamp_idx ON public.analytics_events USING btree ("timestamp");
CREATE INDEX analytics_events_type_idx ON public.analytics_events USING btree (event_type);
CREATE INDEX analytics_events_user_idx ON public.analytics_events USING btree (user_id);
CREATE INDEX audit_logs_action_idx ON public.admin_audit_logs USING btree (action);
CREATE INDEX audit_logs_admin_idx ON public.admin_audit_logs USING btree (admin_id);
CREATE INDEX audit_logs_entity_idx ON public.admin_audit_logs USING btree (entity_type, entity_id);
CREATE INDEX audit_logs_timestamp_idx ON public.admin_audit_logs USING btree ("timestamp");
CREATE INDEX business_metrics_business_idx ON public.business_metrics USING btree (business_id);
CREATE INDEX business_metrics_date_idx ON public.business_metrics USING btree (date);
CREATE UNIQUE INDEX business_metrics_unique_idx ON public.business_metrics USING btree (business_id, date);
CREATE INDEX campaign_clicks_campaign_idx ON public.campaign_clicks USING btree (campaign_id);
CREATE INDEX campaign_clicks_link_idx ON public.campaign_clicks USING btree (link_id);
CREATE INDEX campaign_clicks_recipient_idx ON public.campaign_clicks USING btree (recipient_id);
CREATE INDEX campaign_links_campaign_idx ON public.campaign_links USING btree (campaign_id);
CREATE INDEX campaign_recipients_campaign_idx ON public.campaign_recipients USING btree (campaign_id);
CREATE INDEX campaign_recipients_email_idx ON public.campaign_recipients USING btree (email);
CREATE INDEX campaign_recipients_user_idx ON public.campaign_recipients USING btree (user_id);
CREATE INDEX chat_analytics_conversation_idx ON public.chat_analytics USING btree (conversation_id);
CREATE INDEX chat_analytics_created_idx ON public.chat_analytics USING btree (created_at);
CREATE INDEX chat_analytics_resolved_idx ON public.chat_analytics USING btree (resolved);
CREATE INDEX chat_conversations_business_idx ON public.chat_conversations USING btree (business_id);
CREATE INDEX chat_conversations_created_idx ON public.chat_conversations USING btree (created_at);
CREATE INDEX chat_conversations_escalated_idx ON public.chat_conversations USING btree (escalated, escalated_to);
CREATE INDEX chat_conversations_session_idx ON public.chat_conversations USING btree (session_id);
CREATE INDEX chat_conversations_status_idx ON public.chat_conversations USING btree (status);
CREATE INDEX chat_conversations_user_idx ON public.chat_conversations USING btree (user_id);
CREATE INDEX chat_kb_active_idx ON public.chat_knowledge_base USING btree (is_active);
CREATE INDEX chat_kb_category_idx ON public.chat_knowledge_base USING btree (category);
CREATE INDEX chat_kb_priority_idx ON public.chat_knowledge_base USING btree (priority);
CREATE INDEX chat_kb_slug_idx ON public.chat_knowledge_base USING btree (slug);
CREATE INDEX chat_messages_conversation_idx ON public.chat_messages USING btree (conversation_id);
CREATE INDEX chat_messages_created_idx ON public.chat_messages USING btree (created_at);
CREATE INDEX chat_messages_flagged_idx ON public.chat_messages USING btree (flagged);
CREATE INDEX chat_messages_role_idx ON public.chat_messages USING btree (role);
CREATE INDEX chat_proactive_active_idx ON public.chat_proactive_triggers USING btree (is_active);
CREATE INDEX chat_proactive_priority_idx ON public.chat_proactive_triggers USING btree (priority);
CREATE INDEX chat_quick_actions_active_idx ON public.chat_quick_actions USING btree (is_active);
CREATE INDEX chat_quick_actions_order_idx ON public.chat_quick_actions USING btree (display_order);
CREATE INDEX chat_sessions_active_idx ON public.chat_sessions USING btree (is_active);
CREATE INDEX chat_sessions_last_activity_idx ON public.chat_sessions USING btree (last_activity);
CREATE INDEX chat_sessions_session_id_idx ON public.chat_sessions USING btree (session_id);
CREATE INDEX chat_sessions_user_idx ON public.chat_sessions USING btree (user_id);
CREATE INDEX cohorts_date_idx ON public.customer_cohorts USING btree (cohort_date);
CREATE INDEX cohorts_type_idx ON public.customer_cohorts USING btree (cohort_type);
CREATE UNIQUE INDEX cohorts_unique_idx ON public.customer_cohorts USING btree (cohort_name, cohort_date);
CREATE INDEX customer_segments_business_idx ON public.customer_segments USING btree (business_id);
CREATE UNIQUE INDEX daily_metrics_date_idx ON public.daily_metrics USING btree (date);
CREATE INDEX error_logs_category_idx ON public.error_logs USING btree (category);
CREATE INDEX error_logs_hash_idx ON public.error_logs USING btree (error_hash);
CREATE INDEX error_logs_last_seen_idx ON public.error_logs USING btree (last_seen_at);
CREATE INDEX error_logs_resolved_idx ON public.error_logs USING btree (resolved);
CREATE INDEX error_logs_severity_idx ON public.error_logs USING btree (severity);
CREATE INDEX funnels_date_idx ON public.conversion_funnels USING btree (date);
CREATE INDEX funnels_name_idx ON public.conversion_funnels USING btree (funnel_name);
CREATE UNIQUE INDEX funnels_unique_idx ON public.conversion_funnels USING btree (funnel_name, date);
CREATE INDEX idx_active_session_expires ON public.active_sessions USING btree (expires_at);
CREATE INDEX idx_active_session_id ON public.active_sessions USING btree (session_id);
CREATE INDEX idx_active_session_user ON public.active_sessions USING btree (user_id);
CREATE INDEX idx_ad_campaigns_business ON public.ad_campaigns USING btree (business_id);
CREATE INDEX idx_ad_campaigns_dates ON public.ad_campaigns USING btree (start_date, end_date);
CREATE INDEX idx_ad_campaigns_spot ON public.ad_campaigns USING btree (ad_spot_id);
CREATE INDEX idx_ad_impressions_campaign ON public.ad_impressions USING btree (campaign_id);
CREATE INDEX idx_ad_impressions_timestamp ON public.ad_impressions USING btree ("timestamp");
CREATE INDEX idx_ai_content_business ON public.ai_generated_content USING btree (business_id);
CREATE INDEX idx_ai_content_created ON public.ai_generated_content USING btree (created_at);
CREATE INDEX idx_ai_content_favorite ON public.ai_generated_content USING btree (is_favorite);
CREATE INDEX idx_ai_content_type ON public.ai_generated_content USING btree (type);
CREATE INDEX idx_ai_images_business ON public.ai_generated_images USING btree (business_id);
CREATE INDEX idx_ai_images_category ON public.ai_generated_images USING btree (category);
CREATE INDEX idx_ai_images_created ON public.ai_generated_images USING btree (created_at);
CREATE INDEX idx_ai_moderation_business ON public.ai_moderation_log USING btree (business_id);
CREATE INDEX idx_ai_moderation_content ON public.ai_moderation_log USING btree (content_id);
CREATE INDEX idx_ai_templates_business ON public.ai_content_templates USING btree (business_id);
CREATE INDEX idx_ai_templates_global ON public.ai_content_templates USING btree (is_global);
CREATE INDEX idx_ai_templates_type ON public.ai_content_templates USING btree (type);
CREATE INDEX idx_ai_tests_business ON public.ai_content_tests USING btree (business_id);
CREATE INDEX idx_ai_tests_status ON public.ai_content_tests USING btree (status);
CREATE INDEX idx_ai_usage_business ON public.ai_usage_tracking USING btree (business_id);
CREATE INDEX idx_ai_usage_created ON public.ai_usage_tracking USING btree (created_at);
CREATE INDEX idx_ai_usage_period ON public.ai_usage_tracking USING btree (billing_period);
CREATE INDEX idx_api_keys_business_id ON public.api_keys USING btree (business_id);
CREATE INDEX idx_api_keys_key_hash ON public.api_keys USING btree (key_hash);
CREATE INDEX idx_api_keys_user_id ON public.api_keys USING btree (user_id);
CREATE INDEX idx_auth_audit_created ON public.auth_audit_logs USING btree (created_at);
CREATE INDEX idx_auth_audit_type ON public.auth_audit_logs USING btree (event_type);
CREATE INDEX idx_auth_audit_user ON public.auth_audit_logs USING btree (user_id);
CREATE INDEX idx_blog_analytics_post ON public.blog_analytics USING btree (post_id);
CREATE INDEX idx_blog_analytics_session ON public.blog_analytics USING btree (session_id);
CREATE INDEX idx_blog_analytics_user ON public.blog_analytics USING btree (user_id);
CREATE INDEX idx_blog_analytics_viewed_at ON public.blog_analytics USING btree (viewed_at);
CREATE INDEX idx_blog_categories_slug ON public.blog_categories USING btree (slug);
CREATE INDEX idx_blog_comments_author ON public.blog_comments USING btree (author_id);
CREATE INDEX idx_blog_comments_parent ON public.blog_comments USING btree (parent_comment_id);
CREATE INDEX idx_blog_comments_post ON public.blog_comments USING btree (post_id);
CREATE INDEX idx_blog_posts_author ON public.blog_posts USING btree (author_id);
CREATE INDEX idx_blog_posts_business ON public.blog_posts USING btree (business_id);
CREATE INDEX idx_blog_posts_category ON public.blog_posts USING btree (category_id);
CREATE INDEX idx_blog_posts_published ON public.blog_posts USING btree (published_at);
CREATE INDEX idx_blog_posts_slug ON public.blog_posts USING btree (slug);
CREATE INDEX idx_blog_posts_status ON public.blog_posts USING btree (status);
CREATE INDEX idx_blog_posts_view_count ON public.blog_posts USING btree (view_count);
CREATE INDEX idx_blog_revisions_post ON public.blog_revisions USING btree (post_id);
CREATE INDEX idx_blog_subscriptions_user ON public.blog_subscriptions USING btree (user_id);
CREATE INDEX idx_blog_tags_slug ON public.blog_tags USING btree (slug);
CREATE INDEX idx_content_categories_business ON public.social_content_categories USING btree (business_id);
CREATE INDEX idx_device_fingerprints_trusted ON public.device_fingerprints USING btree (trusted);
CREATE INDEX idx_device_fingerprints_user ON public.device_fingerprints USING btree (user_id);
CREATE INDEX idx_failed_login_email ON public.failed_login_attempts USING btree (email);
CREATE INDEX idx_failed_login_ip ON public.failed_login_attempts USING btree (ip_address);
CREATE INDEX idx_failed_login_time ON public.failed_login_attempts USING btree (attempt_time);
CREATE INDEX idx_geo_restriction_active ON public.geo_restrictions USING btree (is_active);
CREATE INDEX idx_ip_access_active ON public.ip_access_control USING btree (is_active, expires_at);
CREATE INDEX idx_lockout_active ON public.account_lockouts USING btree (locked_until, unlocked_at);
CREATE INDEX idx_lockout_email ON public.account_lockouts USING btree (email);
CREATE INDEX idx_notification_created ON public.security_notifications USING btree (created_at);
CREATE INDEX idx_notification_priority ON public.security_notifications USING btree (priority);
CREATE INDEX idx_notification_status ON public.security_notifications USING btree (status);
CREATE INDEX idx_premium_features_business ON public.premium_features USING btree (business_id);
CREATE INDEX idx_premium_features_type ON public.premium_features USING btree (feature_type);
CREATE INDEX idx_rate_limit_identifier ON public.rate_limit_records USING btree (identifier);
CREATE INDEX idx_rate_limit_window ON public.rate_limit_records USING btree (window_end);
CREATE INDEX idx_rate_violation_created ON public.rate_limit_violations USING btree (created_at);
CREATE INDEX idx_rate_violation_identifier ON public.rate_limit_violations USING btree (identifier);
CREATE INDEX idx_rate_violation_ip ON public.rate_limit_violations USING btree (ip_address);
CREATE INDEX idx_rate_violation_user ON public.rate_limit_violations USING btree (user_id);
CREATE INDEX idx_reading_lists_user ON public.blog_reading_lists USING btree (user_id);
CREATE INDEX idx_recent_purchases_created ON public.recent_purchases USING btree (created_at);
CREATE INDEX idx_response_templates_business ON public.social_response_templates USING btree (business_id);
CREATE INDEX idx_security_event_created ON public.security_events USING btree (created_at);
CREATE INDEX idx_security_event_severity ON public.security_events USING btree (severity);
CREATE INDEX idx_security_event_type ON public.security_events USING btree (event_type);
CREATE INDEX idx_security_event_user ON public.security_events USING btree (user_id);
CREATE INDEX idx_session_events_created ON public.session_events USING btree (created_at);
CREATE INDEX idx_session_events_session ON public.session_events USING btree (session_id);
CREATE INDEX idx_session_events_severity ON public.session_events USING btree (severity);
CREATE INDEX idx_session_events_type ON public.session_events USING btree (event_type);
CREATE INDEX idx_session_events_user ON public.session_events USING btree (user_id);
CREATE INDEX idx_social_accounts_business ON public.social_media_accounts USING btree (business_id);
CREATE INDEX idx_social_analytics_business ON public.social_media_analytics USING btree (business_id);
CREATE INDEX idx_social_analytics_date ON public.social_media_analytics USING btree (metric_date);
CREATE INDEX idx_social_analytics_platform ON public.social_media_analytics USING btree (platform);
CREATE INDEX idx_social_automation_business ON public.social_media_automation USING btree (business_id);
CREATE INDEX idx_social_campaigns_business ON public.social_media_campaigns USING btree (business_id);
CREATE INDEX idx_social_campaigns_status ON public.social_media_campaigns USING btree (status);
CREATE INDEX idx_social_listeners_business ON public.social_media_listeners USING btree (business_id);
CREATE INDEX idx_social_mentions_business ON public.social_media_mentions USING btree (business_id);
CREATE INDEX idx_social_mentions_mentioned_at ON public.social_media_mentions USING btree (mentioned_at);
CREATE INDEX idx_social_messages_business ON public.social_media_messages USING btree (business_id);
CREATE INDEX idx_social_messages_platform ON public.social_media_messages USING btree (platform);
CREATE INDEX idx_social_messages_status ON public.social_media_messages USING btree (status);
CREATE INDEX idx_social_posts_business ON public.social_media_posts USING btree (business_id);
CREATE INDEX idx_social_posts_scheduled ON public.social_media_posts USING btree (scheduled_at);
CREATE INDEX idx_social_posts_status ON public.social_media_posts USING btree (status);
CREATE INDEX idx_social_team_business ON public.social_media_team USING btree (business_id);
CREATE INDEX idx_timeline_entrepreneur ON public.timeline_showcases USING btree (entrepreneur_id);
CREATE INDEX idx_timeline_published ON public.timeline_showcases USING btree (is_published, published_at);
CREATE INDEX idx_timeline_votes ON public.timeline_showcases USING btree (vote_count);
CREATE UNIQUE INDEX idx_unique_blog_subscription_email ON public.blog_subscriptions USING btree (email);
CREATE UNIQUE INDEX idx_unique_business_gmb_token ON public.gmb_tokens USING btree (business_id);
CREATE UNIQUE INDEX idx_unique_device_fingerprint ON public.device_fingerprints USING btree (user_id, fingerprint);
CREATE UNIQUE INDEX idx_unique_entrepreneur_business ON public.entrepreneur_businesses USING btree (entrepreneur_id, business_id);
CREATE UNIQUE INDEX idx_unique_geo_restriction ON public.geo_restrictions USING btree (country_code, region_code, restriction_type);
CREATE UNIQUE INDEX idx_unique_gmb_review ON public.gmb_reviews USING btree (business_id, gmb_review_id);
CREATE UNIQUE INDEX idx_unique_ip_access ON public.ip_access_control USING btree (ip_address, access_type);
CREATE UNIQUE INDEX idx_unique_post_tag ON public.blog_post_tags USING btree (post_id, tag_id);
CREATE UNIQUE INDEX idx_unique_post_user_bookmark ON public.blog_bookmarks USING btree (post_id, user_id);
CREATE UNIQUE INDEX idx_unique_post_user_reaction ON public.blog_reactions USING btree (post_id, user_id, reaction_type);
CREATE UNIQUE INDEX idx_unique_post_version ON public.blog_revisions USING btree (post_id, version);
CREATE UNIQUE INDEX idx_unique_rate_limit ON public.rate_limit_records USING btree (identifier, limit_type, window_start);
CREATE UNIQUE INDEX idx_unique_session_token ON public.user_sessions USING btree (token);
CREATE UNIQUE INDEX idx_unique_showcase_vote ON public.timeline_showcase_votes USING btree (showcase_id, user_id);
CREATE UNIQUE INDEX idx_unique_social_account ON public.social_media_accounts USING btree (business_id, platform, account_id);
CREATE UNIQUE INDEX idx_unique_social_team_member ON public.social_media_team USING btree (business_id, user_id);
CREATE UNIQUE INDEX idx_unique_user_month_vote ON public.spotlight_votes USING btree (user_id, month);
CREATE INDEX idx_user_sessions_active ON public.user_sessions USING btree (is_active);
CREATE INDEX idx_user_sessions_expires ON public.user_sessions USING btree (expires_at);
CREATE INDEX idx_user_sessions_user ON public.user_sessions USING btree (user_id);
CREATE INDEX idx_vendor_transactions_business ON public.vendor_transactions USING btree (business_id);
CREATE INDEX idx_vendor_transactions_order ON public.vendor_transactions USING btree (order_id);
CREATE INDEX lead_capture_forms_business_idx ON public.lead_capture_forms USING btree (business_id);
CREATE INDEX lead_submissions_business_idx ON public.lead_submissions USING btree (business_id);
CREATE INDEX lead_submissions_email_idx ON public.lead_submissions USING btree (email);
CREATE INDEX lead_submissions_form_idx ON public.lead_submissions USING btree (form_id);
CREATE INDEX loyalty_transactions_account_idx ON public.loyalty_transactions USING btree (account_id);
CREATE INDEX loyalty_transactions_created_idx ON public.loyalty_transactions USING btree (created_at);
CREATE INDEX loyalty_transactions_type_idx ON public.loyalty_transactions USING btree (type);
CREATE INDEX loyalty_transactions_user_idx ON public.loyalty_transactions USING btree (user_id);
CREATE INDEX marketing_workflows_business_idx ON public.marketing_workflows USING btree (business_id);
CREATE INDEX premium_slots_active_idx ON public.premium_ad_slots USING btree (is_active);
CREATE INDEX premium_slots_order_idx ON public.premium_ad_slots USING btree (display_order);
CREATE INDEX product_metrics_date_idx ON public.product_metrics USING btree (date);
CREATE INDEX product_metrics_product_idx ON public.product_metrics USING btree (product_id);
CREATE UNIQUE INDEX product_metrics_unique_idx ON public.product_metrics USING btree (product_id, date);
CREATE INDEX referrals_code_idx ON public.referrals USING btree (referral_code);
CREATE INDEX referrals_referee_idx ON public.referrals USING btree (referee_id);
CREATE INDEX referrals_referrer_idx ON public.referrals USING btree (referrer_id);
CREATE INDEX referrals_status_idx ON public.referrals USING btree (status);
CREATE INDEX reward_redemptions_reward_idx ON public.reward_redemptions USING btree (reward_id);
CREATE INDEX reward_redemptions_status_idx ON public.reward_redemptions USING btree (status);
CREATE INDEX reward_redemptions_user_idx ON public.reward_redemptions USING btree (user_id);
CREATE INDEX rewards_active_idx ON public.rewards USING btree (is_active);
CREATE INDEX rewards_business_idx ON public.rewards USING btree (business_id);
CREATE INDEX rewards_featured_idx ON public.rewards USING btree (is_featured);
CREATE INDEX segment_members_segment_idx ON public.segment_members USING btree (segment_id);
CREATE INDEX segment_members_unique ON public.segment_members USING btree (segment_id, user_id);
CREATE INDEX segment_members_user_idx ON public.segment_members USING btree (user_id);
CREATE INDEX social_accounts_business_idx ON public.social_accounts USING btree (business_id);
CREATE INDEX social_accounts_platform_idx ON public.social_accounts USING btree (platform);
CREATE UNIQUE INDEX social_accounts_unique_idx ON public.social_accounts USING btree (user_id, platform, account_id);
CREATE INDEX social_accounts_user_idx ON public.social_accounts USING btree (user_id);
CREATE INDEX social_analytics_account_idx ON public.social_analytics USING btree (social_account_id);
CREATE INDEX social_analytics_date_idx ON public.social_analytics USING btree (date);
CREATE UNIQUE INDEX social_analytics_unique_idx ON public.social_analytics USING btree (social_account_id, date);
CREATE INDEX social_posts_account_idx ON public.social_posts USING btree (social_account_id);
CREATE INDEX social_posts_business_idx ON public.social_posts USING btree (business_id);
CREATE INDEX social_posts_scheduled_idx ON public.social_posts USING btree (scheduled_for);
CREATE INDEX social_posts_status_idx ON public.social_posts USING btree (status);
CREATE UNIQUE INDEX social_tokens_account_idx ON public.social_tokens USING btree (social_account_id);
CREATE INDEX user_metrics_date_idx ON public.user_metrics USING btree (date);
CREATE UNIQUE INDEX user_metrics_unique_idx ON public.user_metrics USING btree (user_id, date);
CREATE INDEX user_metrics_user_idx ON public.user_metrics USING btree (user_id);
CREATE INDEX user_roles_role_idx ON public.user_roles USING btree (role_id);
CREATE UNIQUE INDEX user_roles_unique_idx ON public.user_roles USING btree (user_id, role_id);
CREATE INDEX user_roles_user_idx ON public.user_roles USING btree (user_id);
CREATE INDEX workflow_enrollments_user_idx ON public.workflow_enrollments USING btree (user_id);
CREATE INDEX workflow_enrollments_workflow_idx ON public.workflow_enrollments USING btree (workflow_id);
CREATE INDEX workflow_step_logs_enrollment_idx ON public.workflow_step_logs USING btree (enrollment_id);
CREATE INDEX workflow_step_logs_workflow_idx ON public.workflow_step_logs USING btree (workflow_id);
ALTER TABLE ONLY public.account_lockouts
    ADD CONSTRAINT account_lockouts_unlocked_by_users_id_fk FOREIGN KEY (unlocked_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.active_sessions
    ADD CONSTRAINT active_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_ad_spot_id_ad_spots_id_fk FOREIGN KEY (ad_spot_id) REFERENCES public.ad_spots(id);
ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ad_campaigns
    ADD CONSTRAINT ad_campaigns_showcase_id_timeline_showcases_id_fk FOREIGN KEY (showcase_id) REFERENCES public.timeline_showcases(id);
ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_campaign_id_ad_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.ad_campaigns(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ad_impressions
    ADD CONSTRAINT ad_impressions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.admin_audit_logs
    ADD CONSTRAINT admin_audit_logs_admin_id_users_id_fk FOREIGN KEY (admin_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.ai_content_templates
    ADD CONSTRAINT ai_content_templates_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ai_content_templates
    ADD CONSTRAINT ai_content_templates_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.ai_content_tests
    ADD CONSTRAINT ai_content_tests_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ai_generated_content
    ADD CONSTRAINT ai_generated_content_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ai_generated_content
    ADD CONSTRAINT ai_generated_content_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.ai_generated_images
    ADD CONSTRAINT ai_generated_images_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ai_generated_images
    ADD CONSTRAINT ai_generated_images_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.ai_moderation_log
    ADD CONSTRAINT ai_moderation_log_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ai_usage_tracking
    ADD CONSTRAINT ai_usage_tracking_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ai_usage_tracking
    ADD CONSTRAINT ai_usage_tracking_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.analytics_events
    ADD CONSTRAINT analytics_events_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.api_keys
    ADD CONSTRAINT api_keys_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.auth_audit_logs
    ADD CONSTRAINT auth_audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.blog_analytics
    ADD CONSTRAINT blog_analytics_post_id_blog_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_analytics
    ADD CONSTRAINT blog_analytics_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.blog_bookmarks
    ADD CONSTRAINT blog_bookmarks_post_id_blog_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_bookmarks
    ADD CONSTRAINT blog_bookmarks_reading_list_id_blog_reading_lists_id_fk FOREIGN KEY (reading_list_id) REFERENCES public.blog_reading_lists(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_bookmarks
    ADD CONSTRAINT blog_bookmarks_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_parent_comment_id_blog_comments_id_fk FOREIGN KEY (parent_comment_id) REFERENCES public.blog_comments(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_comments
    ADD CONSTRAINT blog_comments_post_id_blog_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_post_id_blog_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_post_tags
    ADD CONSTRAINT blog_post_tags_tag_id_blog_tags_id_fk FOREIGN KEY (tag_id) REFERENCES public.blog_tags(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_category_id_blog_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.blog_categories(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.blog_posts
    ADD CONSTRAINT blog_posts_last_edited_by_users_id_fk FOREIGN KEY (last_edited_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.blog_reactions
    ADD CONSTRAINT blog_reactions_post_id_blog_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_reactions
    ADD CONSTRAINT blog_reactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_reading_lists
    ADD CONSTRAINT blog_reading_lists_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_revisions
    ADD CONSTRAINT blog_revisions_edited_by_users_id_fk FOREIGN KEY (edited_by) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_revisions
    ADD CONSTRAINT blog_revisions_post_id_blog_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.blog_posts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.blog_subscriptions
    ADD CONSTRAINT blog_subscriptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.business_followers
    ADD CONSTRAINT business_followers_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.business_followers
    ADD CONSTRAINT business_followers_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.business_metrics
    ADD CONSTRAINT business_metrics_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.businesses
    ADD CONSTRAINT businesses_owner_id_users_id_fk FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.campaign_clicks
    ADD CONSTRAINT campaign_clicks_campaign_id_marketing_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.campaign_clicks
    ADD CONSTRAINT campaign_clicks_link_id_campaign_links_id_fk FOREIGN KEY (link_id) REFERENCES public.campaign_links(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.campaign_clicks
    ADD CONSTRAINT campaign_clicks_recipient_id_campaign_recipients_id_fk FOREIGN KEY (recipient_id) REFERENCES public.campaign_recipients(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.campaign_links
    ADD CONSTRAINT campaign_links_campaign_id_marketing_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_campaign_id_marketing_campaigns_id_fk FOREIGN KEY (campaign_id) REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.campaign_recipients
    ADD CONSTRAINT campaign_recipients_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.chat_analytics
    ADD CONSTRAINT chat_analytics_conversation_id_chat_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_escalated_to_users_id_fk FOREIGN KEY (escalated_to) REFERENCES public.users(id);
ALTER TABLE ONLY public.chat_conversations
    ADD CONSTRAINT chat_conversations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.chat_knowledge_base
    ADD CONSTRAINT chat_knowledge_base_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.chat_knowledge_base
    ADD CONSTRAINT chat_knowledge_base_last_edited_by_users_id_fk FOREIGN KEY (last_edited_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_conversation_id_chat_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.chat_conversations(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.chat_sessions
    ADD CONSTRAINT chat_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.customer_segments
    ADD CONSTRAINT customer_segments_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.device_fingerprints
    ADD CONSTRAINT device_fingerprints_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.engagement_metrics
    ADD CONSTRAINT engagement_metrics_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.entrepreneur_businesses
    ADD CONSTRAINT entrepreneur_businesses_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.entrepreneur_businesses
    ADD CONSTRAINT entrepreneur_businesses_entrepreneur_id_entrepreneurs_id_fk FOREIGN KEY (entrepreneur_id) REFERENCES public.entrepreneurs(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.entrepreneurs
    ADD CONSTRAINT entrepreneurs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.error_logs
    ADD CONSTRAINT error_logs_resolved_by_users_id_fk FOREIGN KEY (resolved_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.geo_restrictions
    ADD CONSTRAINT geo_restrictions_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.gmb_reviews
    ADD CONSTRAINT gmb_reviews_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.gmb_sync_history
    ADD CONSTRAINT gmb_sync_history_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.gmb_tokens
    ADD CONSTRAINT gmb_tokens_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.gmb_tokens
    ADD CONSTRAINT gmb_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.ip_access_control
    ADD CONSTRAINT ip_access_control_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.lead_capture_forms
    ADD CONSTRAINT lead_capture_forms_add_to_segment_id_customer_segments_id_fk FOREIGN KEY (add_to_segment_id) REFERENCES public.customer_segments(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.lead_capture_forms
    ADD CONSTRAINT lead_capture_forms_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.lead_capture_forms
    ADD CONSTRAINT lead_capture_forms_enroll_in_workflow_id_marketing_workflows_id FOREIGN KEY (enroll_in_workflow_id) REFERENCES public.marketing_workflows(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.lead_submissions
    ADD CONSTRAINT lead_submissions_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.lead_submissions
    ADD CONSTRAINT lead_submissions_form_id_lead_capture_forms_id_fk FOREIGN KEY (form_id) REFERENCES public.lead_capture_forms(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.lead_submissions
    ADD CONSTRAINT lead_submissions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_tier_id_loyalty_tiers_id_fk FOREIGN KEY (tier_id) REFERENCES public.loyalty_tiers(id);
ALTER TABLE ONLY public.loyalty_accounts
    ADD CONSTRAINT loyalty_accounts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_account_id_loyalty_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.loyalty_accounts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.loyalty_transactions
    ADD CONSTRAINT loyalty_transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.marketing_campaigns
    ADD CONSTRAINT marketing_campaigns_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.marketing_campaigns
    ADD CONSTRAINT marketing_campaigns_target_segment_id_customer_segments_id_fk FOREIGN KEY (target_segment_id) REFERENCES public.customer_segments(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.marketing_workflows
    ADD CONSTRAINT marketing_workflows_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_business_id_businesses_id_fk FOREIGN KEY (receiver_business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_users_id_fk FOREIGN KEY (receiver_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_business_id_businesses_id_fk FOREIGN KEY (sender_business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_shared_business_id_businesses_id_fk FOREIGN KEY (shared_business_id) REFERENCES public.businesses(id);
ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_shared_product_id_products_id_fk FOREIGN KEY (shared_product_id) REFERENCES public.products(id);
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_vendor_business_id_businesses_id_fk FOREIGN KEY (vendor_business_id) REFERENCES public.businesses(id);
ALTER TABLE ONLY public.payments
    ADD CONSTRAINT payments_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_post_id_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.post_comments
    ADD CONSTRAINT post_comments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_post_id_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.posts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.post_likes
    ADD CONSTRAINT post_likes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.posts
    ADD CONSTRAINT posts_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.premium_ad_slots
    ADD CONSTRAINT premium_ad_slots_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.premium_features
    ADD CONSTRAINT premium_features_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.premium_features
    ADD CONSTRAINT premium_features_showcase_id_timeline_showcases_id_fk FOREIGN KEY (showcase_id) REFERENCES public.timeline_showcases(id);
ALTER TABLE ONLY public.product_metrics
    ADD CONSTRAINT product_metrics_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.rate_limit_violations
    ADD CONSTRAINT rate_limit_violations_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.recent_purchases
    ADD CONSTRAINT recent_purchases_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.recent_purchases
    ADD CONSTRAINT recent_purchases_vendor_business_id_businesses_id_fk FOREIGN KEY (vendor_business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referee_id_users_id_fk FOREIGN KEY (referee_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.referrals
    ADD CONSTRAINT referrals_referrer_id_users_id_fk FOREIGN KEY (referrer_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);
ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_reward_id_rewards_id_fk FOREIGN KEY (reward_id) REFERENCES public.rewards(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_transaction_id_loyalty_transactions_id_fk FOREIGN KEY (transaction_id) REFERENCES public.loyalty_transactions(id);
ALTER TABLE ONLY public.reward_redemptions
    ADD CONSTRAINT reward_redemptions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.rewards
    ADD CONSTRAINT rewards_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);
ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_resolved_by_users_id_fk FOREIGN KEY (resolved_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.security_events
    ADD CONSTRAINT security_events_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.segment_members
    ADD CONSTRAINT segment_members_segment_id_customer_segments_id_fk FOREIGN KEY (segment_id) REFERENCES public.customer_segments(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.segment_members
    ADD CONSTRAINT segment_members_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.session_events
    ADD CONSTRAINT session_events_session_id_user_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.user_sessions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.session_events
    ADD CONSTRAINT session_events_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE ONLY public.social_accounts
    ADD CONSTRAINT social_accounts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);
ALTER TABLE ONLY public.social_analytics
    ADD CONSTRAINT social_analytics_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE ONLY public.social_analytics
    ADD CONSTRAINT social_analytics_social_account_id_social_accounts_id_fk FOREIGN KEY (social_account_id) REFERENCES public.social_accounts(id);
ALTER TABLE ONLY public.social_content_categories
    ADD CONSTRAINT social_content_categories_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_accounts
    ADD CONSTRAINT social_media_accounts_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_accounts
    ADD CONSTRAINT social_media_accounts_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_analytics
    ADD CONSTRAINT social_media_analytics_account_id_social_media_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.social_media_accounts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_analytics
    ADD CONSTRAINT social_media_analytics_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_analytics
    ADD CONSTRAINT social_media_analytics_post_id_social_media_posts_id_fk FOREIGN KEY (post_id) REFERENCES public.social_media_posts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_automation
    ADD CONSTRAINT social_media_automation_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_campaigns
    ADD CONSTRAINT social_media_campaigns_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_campaigns
    ADD CONSTRAINT social_media_campaigns_created_by_users_id_fk FOREIGN KEY (created_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.social_media_listeners
    ADD CONSTRAINT social_media_listeners_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_mentions
    ADD CONSTRAINT social_media_mentions_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_mentions
    ADD CONSTRAINT social_media_mentions_listener_id_social_media_listeners_id_fk FOREIGN KEY (listener_id) REFERENCES public.social_media_listeners(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_messages
    ADD CONSTRAINT social_media_messages_account_id_social_media_accounts_id_fk FOREIGN KEY (account_id) REFERENCES public.social_media_accounts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_messages
    ADD CONSTRAINT social_media_messages_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users(id);
ALTER TABLE ONLY public.social_media_messages
    ADD CONSTRAINT social_media_messages_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_messages
    ADD CONSTRAINT social_media_messages_parent_message_id_social_media_messages_i FOREIGN KEY (parent_message_id) REFERENCES public.social_media_messages(id);
ALTER TABLE ONLY public.social_media_posts
    ADD CONSTRAINT social_media_posts_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.social_media_posts
    ADD CONSTRAINT social_media_posts_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_posts
    ADD CONSTRAINT social_media_posts_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_team
    ADD CONSTRAINT social_media_team_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_media_team
    ADD CONSTRAINT social_media_team_invited_by_users_id_fk FOREIGN KEY (invited_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.social_media_team
    ADD CONSTRAINT social_media_team_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_posts
    ADD CONSTRAINT social_posts_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id);
ALTER TABLE ONLY public.social_posts
    ADD CONSTRAINT social_posts_social_account_id_social_accounts_id_fk FOREIGN KEY (social_account_id) REFERENCES public.social_accounts(id);
ALTER TABLE ONLY public.social_response_templates
    ADD CONSTRAINT social_response_templates_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.social_tokens
    ADD CONSTRAINT social_tokens_social_account_id_social_accounts_id_fk FOREIGN KEY (social_account_id) REFERENCES public.social_accounts(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.spotlight_history
    ADD CONSTRAINT spotlight_history_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.spotlight_votes
    ADD CONSTRAINT spotlight_votes_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.spotlight_votes
    ADD CONSTRAINT spotlight_votes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.spotlights
    ADD CONSTRAINT spotlights_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.timeline_showcase_votes
    ADD CONSTRAINT timeline_showcase_votes_showcase_id_timeline_showcases_id_fk FOREIGN KEY (showcase_id) REFERENCES public.timeline_showcases(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.timeline_showcase_votes
    ADD CONSTRAINT timeline_showcase_votes_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.timeline_showcases
    ADD CONSTRAINT timeline_showcases_approved_by_users_id_fk FOREIGN KEY (approved_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.timeline_showcases
    ADD CONSTRAINT timeline_showcases_author_id_users_id_fk FOREIGN KEY (author_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.timeline_showcases
    ADD CONSTRAINT timeline_showcases_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.timeline_showcases
    ADD CONSTRAINT timeline_showcases_entrepreneur_id_entrepreneurs_id_fk FOREIGN KEY (entrepreneur_id) REFERENCES public.entrepreneurs(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_metrics
    ADD CONSTRAINT user_metrics_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_assigned_by_users_id_fk FOREIGN KEY (assigned_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_admin_roles_id_fk FOREIGN KEY (role_id) REFERENCES public.admin_roles(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.vendor_transactions
    ADD CONSTRAINT vendor_transactions_business_id_businesses_id_fk FOREIGN KEY (business_id) REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.vendor_transactions
    ADD CONSTRAINT vendor_transactions_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.workflow_enrollments
    ADD CONSTRAINT workflow_enrollments_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.workflow_enrollments
    ADD CONSTRAINT workflow_enrollments_workflow_id_marketing_workflows_id_fk FOREIGN KEY (workflow_id) REFERENCES public.marketing_workflows(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.workflow_step_logs
    ADD CONSTRAINT workflow_step_logs_enrollment_id_workflow_enrollments_id_fk FOREIGN KEY (enrollment_id) REFERENCES public.workflow_enrollments(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.workflow_step_logs
    ADD CONSTRAINT workflow_step_logs_workflow_id_marketing_workflows_id_fk FOREIGN KEY (workflow_id) REFERENCES public.marketing_workflows(id) ON DELETE CASCADE;
ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO neon_superuser WITH GRANT OPTION;
ALTER DEFAULT PRIVILEGES FOR ROLE cloud_admin IN SCHEMA public GRANT ALL ON TABLES TO neon_superuser WITH GRANT OPTION;