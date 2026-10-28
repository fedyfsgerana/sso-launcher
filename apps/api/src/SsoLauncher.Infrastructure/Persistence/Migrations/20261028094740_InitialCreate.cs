using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace SsoLauncher.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateSequence(
                name: "audit_logs_hilo_seq",
                incrementBy: 10);

            migrationBuilder.CreateTable(
                name: "audit_data_versions",
                columns: table => new
                {
                    audit_data_versions_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    entity_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    entity_id = table.Column<long>(type: "bigint", nullable: false),
                    version = table.Column<int>(type: "integer", nullable: false),
                    action = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    snapshot = table.Column<string>(type: "jsonb", nullable: false),
                    audit_logs_id = table.Column<long>(type: "bigint", nullable: true),
                    actor_id = table.Column<long>(type: "bigint", nullable: true),
                    actor_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_audit_data_versions", x => x.audit_data_versions_id);
                });

            migrationBuilder.CreateTable(
                name: "mgmt_applications",
                columns: table => new
                {
                    mgmt_applications_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    app_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false, defaultValue: ""),
                    launch_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    category = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false, defaultValue: ""),
                    icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "apps"),
                    color = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "app-hr"),
                    status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "active"),
                    maintenance_message = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false, defaultValue: ""),
                    uses_sso = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by_id = table.Column<long>(type: "bigint", nullable: true),
                    deleted_by_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    delete_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_mgmt_applications", x => x.mgmt_applications_id);
                });

            migrationBuilder.CreateTable(
                name: "mgmt_login_failures",
                columns: table => new
                {
                    mgmt_login_failures_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    ip_address = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                    occurred_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    cleared_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_mgmt_login_failures", x => x.mgmt_login_failures_id);
                });

            migrationBuilder.CreateTable(
                name: "mgmt_portal_menus",
                columns: table => new
                {
                    mgmt_portal_menus_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    parent_id = table.Column<long>(type: "bigint", nullable: true),
                    label = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    target_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    target_value = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_system = table.Column<bool>(type: "boolean", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    maintenance_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    maintenance_title = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    maintenance_message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by_id = table.Column<long>(type: "bigint", nullable: true),
                    deleted_by_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    delete_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_mgmt_portal_menus", x => x.mgmt_portal_menus_id);
                    table.ForeignKey(
                        name: "fk_mgmt_portal_menus_parent",
                        column: x => x.parent_id,
                        principalTable: "mgmt_portal_menus",
                        principalColumn: "mgmt_portal_menus_id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "mgmt_sso_token_uses",
                columns: table => new
                {
                    mgmt_sso_token_uses_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    token_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    used_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_mgmt_sso_token_uses", x => x.mgmt_sso_token_uses_id);
                });

            migrationBuilder.CreateTable(
                name: "mgmt_user_groups",
                columns: table => new
                {
                    mgmt_user_groups_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: false),
                    description = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: false, defaultValue: ""),
                    department = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    departemen_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by_id = table.Column<long>(type: "bigint", nullable: true),
                    deleted_by_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    delete_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_mgmt_user_groups", x => x.mgmt_user_groups_id);
                });

            migrationBuilder.CreateTable(
                name: "mgmt_users",
                columns: table => new
                {
                    mgmt_users_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    email = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    employee_number = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    department = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    departemen_code = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    job_title = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by_id = table.Column<long>(type: "bigint", nullable: true),
                    deleted_by_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    delete_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_mgmt_users", x => x.mgmt_users_id);
                });

            migrationBuilder.CreateTable(
                name: "mgmt_application_service_credentials",
                columns: table => new
                {
                    mgmt_app_credentials_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    mgmt_applications_id = table.Column<long>(type: "bigint", nullable: false),
                    client_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    secret_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    scope = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    last_used_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    guide_downloaded_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by_id = table.Column<long>(type: "bigint", nullable: true),
                    deleted_by_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    delete_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_mgmt_application_service_credentials", x => x.mgmt_app_credentials_id);
                    table.ForeignKey(
                        name: "fk_mgmt_app_credentials_mgmt_applications",
                        column: x => x.mgmt_applications_id,
                        principalTable: "mgmt_applications",
                        principalColumn: "mgmt_applications_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "mgmt_group_menu_actions",
                columns: table => new
                {
                    mgmt_group_menu_actions_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    mgmt_user_groups_id = table.Column<long>(type: "bigint", nullable: false),
                    mgmt_portal_menus_id = table.Column<long>(type: "bigint", nullable: false),
                    action_key = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_mgmt_group_menu_actions", x => x.mgmt_group_menu_actions_id);
                    table.ForeignKey(
                        name: "fk_mgmt_group_menu_actions_mgmt_portal_menus",
                        column: x => x.mgmt_portal_menus_id,
                        principalTable: "mgmt_portal_menus",
                        principalColumn: "mgmt_portal_menus_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_mgmt_group_menu_actions_mgmt_user_groups",
                        column: x => x.mgmt_user_groups_id,
                        principalTable: "mgmt_user_groups",
                        principalColumn: "mgmt_user_groups_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "mgmt_user_group_application_accesses",
                columns: table => new
                {
                    mgmt_group_app_accesses_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    mgmt_user_groups_id = table.Column<long>(type: "bigint", nullable: false),
                    mgmt_applications_id = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by_id = table.Column<long>(type: "bigint", nullable: true),
                    deleted_by_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    delete_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_mgmt_user_group_application_accesses", x => x.mgmt_group_app_accesses_id);
                    table.ForeignKey(
                        name: "fk_mgmt_group_app_accesses_mgmt_applications",
                        column: x => x.mgmt_applications_id,
                        principalTable: "mgmt_applications",
                        principalColumn: "mgmt_applications_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_mgmt_group_app_accesses_mgmt_user_groups",
                        column: x => x.mgmt_user_groups_id,
                        principalTable: "mgmt_user_groups",
                        principalColumn: "mgmt_user_groups_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "mgmt_user_group_menu_accesses",
                columns: table => new
                {
                    mgmt_group_menu_accesses_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    mgmt_user_groups_id = table.Column<long>(type: "bigint", nullable: false),
                    mgmt_portal_menus_id = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by_id = table.Column<long>(type: "bigint", nullable: true),
                    deleted_by_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    delete_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_mgmt_user_group_menu_accesses", x => x.mgmt_group_menu_accesses_id);
                    table.ForeignKey(
                        name: "fk_mgmt_group_menu_accesses_mgmt_portal_menus",
                        column: x => x.mgmt_portal_menus_id,
                        principalTable: "mgmt_portal_menus",
                        principalColumn: "mgmt_portal_menus_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_mgmt_group_menu_accesses_mgmt_user_groups",
                        column: x => x.mgmt_user_groups_id,
                        principalTable: "mgmt_user_groups",
                        principalColumn: "mgmt_user_groups_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "audit_logs",
                columns: table => new
                {
                    audit_logs_id = table.Column<long>(type: "bigint", nullable: false),
                    occurred_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    actor_id = table.Column<long>(type: "bigint", nullable: true),
                    actor_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    action = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    outcome = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false, defaultValue: "success"),
                    target_type = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    target_id = table.Column<long>(type: "bigint", nullable: true),
                    target_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    summary = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    changes = table.Column<string>(type: "jsonb", nullable: true),
                    ip_address = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: true),
                    user_agent = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                    browser = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    browser_version = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    operating_system = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: true),
                    device_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    device_name = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    session_ref = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: true),
                    request_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    http_method = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: true),
                    request_path = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_audit_logs", x => new { x.audit_logs_id, x.occurred_at });
                    table.ForeignKey(
                        name: "fk_audit_logs_mgmt_users_actor",
                        column: x => x.actor_id,
                        principalTable: "mgmt_users",
                        principalColumn: "mgmt_users_id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "mgmt_refresh_tokens",
                columns: table => new
                {
                    mgmt_refresh_tokens_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    mgmt_users_id = table.Column<long>(type: "bigint", nullable: false),
                    token_hash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    expires_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    revoked_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    last_seen_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_mgmt_refresh_tokens", x => x.mgmt_refresh_tokens_id);
                    table.ForeignKey(
                        name: "fk_mgmt_refresh_tokens_mgmt_users",
                        column: x => x.mgmt_users_id,
                        principalTable: "mgmt_users",
                        principalColumn: "mgmt_users_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "mgmt_user_group_members",
                columns: table => new
                {
                    mgmt_group_members_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    mgmt_user_groups_id = table.Column<long>(type: "bigint", nullable: false),
                    mgmt_users_id = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by_id = table.Column<long>(type: "bigint", nullable: true),
                    deleted_by_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    delete_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_mgmt_user_group_members", x => x.mgmt_group_members_id);
                    table.ForeignKey(
                        name: "fk_mgmt_user_group_members_mgmt_user_groups",
                        column: x => x.mgmt_user_groups_id,
                        principalTable: "mgmt_user_groups",
                        principalColumn: "mgmt_user_groups_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_mgmt_user_group_members_mgmt_users",
                        column: x => x.mgmt_users_id,
                        principalTable: "mgmt_users",
                        principalColumn: "mgmt_users_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "portal_activities",
                columns: table => new
                {
                    portal_activities_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    mgmt_users_id = table.Column<long>(type: "bigint", nullable: false),
                    mgmt_applications_id = table.Column<long>(type: "bigint", nullable: true),
                    kind = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    subtitle = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false, defaultValue: ""),
                    target_path = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    occurred_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by_id = table.Column<long>(type: "bigint", nullable: true),
                    deleted_by_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    delete_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_portal_activities", x => x.portal_activities_id);
                    table.ForeignKey(
                        name: "fk_portal_activities_mgmt_applications",
                        column: x => x.mgmt_applications_id,
                        principalTable: "mgmt_applications",
                        principalColumn: "mgmt_applications_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_portal_activities_mgmt_users",
                        column: x => x.mgmt_users_id,
                        principalTable: "mgmt_users",
                        principalColumn: "mgmt_users_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "portal_favorites",
                columns: table => new
                {
                    portal_favorites_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    mgmt_users_id = table.Column<long>(type: "bigint", nullable: false),
                    mgmt_applications_id = table.Column<long>(type: "bigint", nullable: false),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    deleted_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    deleted_by_id = table.Column<long>(type: "bigint", nullable: true),
                    deleted_by_name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: true),
                    delete_reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_portal_favorites", x => x.portal_favorites_id);
                    table.ForeignKey(
                        name: "fk_portal_favorites_mgmt_applications",
                        column: x => x.mgmt_applications_id,
                        principalTable: "mgmt_applications",
                        principalColumn: "mgmt_applications_id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_portal_favorites_mgmt_users",
                        column: x => x.mgmt_users_id,
                        principalTable: "mgmt_users",
                        principalColumn: "mgmt_users_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "portal_notification_settings",
                columns: table => new
                {
                    portal_notification_settings_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    mgmt_users_id = table.Column<long>(type: "bigint", nullable: false),
                    access_changes = table.Column<bool>(type: "boolean", nullable: false),
                    application_status = table.Column<bool>(type: "boolean", nullable: false),
                    updated_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_portal_notification_settings", x => x.portal_notification_settings_id);
                    table.ForeignKey(
                        name: "fk_portal_notification_settings_mgmt_users",
                        column: x => x.mgmt_users_id,
                        principalTable: "mgmt_users",
                        principalColumn: "mgmt_users_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "portal_notifications",
                columns: table => new
                {
                    portal_notifications_id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    mgmt_users_id = table.Column<long>(type: "bigint", nullable: false),
                    kind = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    title = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    body = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    link = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    created_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                    read_at = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_portal_notifications", x => x.portal_notifications_id);
                    table.ForeignKey(
                        name: "fk_portal_notifications_mgmt_users",
                        column: x => x.mgmt_users_id,
                        principalTable: "mgmt_users",
                        principalColumn: "mgmt_users_id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_audit_data_versions_audit_logs_id",
                table: "audit_data_versions",
                column: "audit_logs_id");

            migrationBuilder.CreateIndex(
                name: "ux_audit_data_versions_entity_version",
                table: "audit_data_versions",
                columns: new[] { "entity_type", "entity_id", "version" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_action",
                table: "audit_logs",
                column: "action");

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_actor_id_occurred_at",
                table: "audit_logs",
                columns: new[] { "actor_id", "occurred_at" });

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_actor_name",
                table: "audit_logs",
                column: "actor_name");

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_occurred_at",
                table: "audit_logs",
                column: "occurred_at");

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_target_name",
                table: "audit_logs",
                column: "target_name");

            migrationBuilder.CreateIndex(
                name: "ix_audit_logs_target_type_target_id",
                table: "audit_logs",
                columns: new[] { "target_type", "target_id" });

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_app_credentials_mgmt_applications_id",
                table: "mgmt_application_service_credentials",
                column: "mgmt_applications_id");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_application_service_credentials_deleted_at",
                table: "mgmt_application_service_credentials",
                column: "deleted_at");

            migrationBuilder.CreateIndex(
                name: "ux_mgmt_app_credentials_client_id",
                table: "mgmt_application_service_credentials",
                column: "client_id",
                unique: true,
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_applications_category_name",
                table: "mgmt_applications",
                columns: new[] { "category", "name" },
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_applications_deleted_at",
                table: "mgmt_applications",
                column: "deleted_at");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_applications_name",
                table: "mgmt_applications",
                column: "name",
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_applications_status",
                table: "mgmt_applications",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "ux_mgmt_applications_slug",
                table: "mgmt_applications",
                column: "slug",
                unique: true,
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_group_menu_actions_mgmt_portal_menus_id",
                table: "mgmt_group_menu_actions",
                column: "mgmt_portal_menus_id");

            migrationBuilder.CreateIndex(
                name: "ux_mgmt_group_menu_actions_group_menu_action",
                table: "mgmt_group_menu_actions",
                columns: new[] { "mgmt_user_groups_id", "mgmt_portal_menus_id", "action_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_login_failures_email_ip_occurred_at",
                table: "mgmt_login_failures",
                columns: new[] { "email", "ip_address", "occurred_at" });

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_login_failures_email_occurred_at",
                table: "mgmt_login_failures",
                columns: new[] { "email", "occurred_at" });

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_portal_menus_deleted_at",
                table: "mgmt_portal_menus",
                column: "deleted_at");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_portal_menus_parent_sort_order",
                table: "mgmt_portal_menus",
                columns: new[] { "parent_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_refresh_tokens_expires_at",
                table: "mgmt_refresh_tokens",
                column: "expires_at");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_refresh_tokens_mgmt_users_id",
                table: "mgmt_refresh_tokens",
                column: "mgmt_users_id");

            migrationBuilder.CreateIndex(
                name: "ux_mgmt_refresh_tokens_token_hash",
                table: "mgmt_refresh_tokens",
                column: "token_hash",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_sso_token_uses_expires_at",
                table: "mgmt_sso_token_uses",
                column: "expires_at");

            migrationBuilder.CreateIndex(
                name: "ux_mgmt_sso_token_uses_token_id",
                table: "mgmt_sso_token_uses",
                column: "token_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_group_app_accesses_mgmt_applications_id",
                table: "mgmt_user_group_application_accesses",
                column: "mgmt_applications_id");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_user_group_application_accesses_deleted_at",
                table: "mgmt_user_group_application_accesses",
                column: "deleted_at");

            migrationBuilder.CreateIndex(
                name: "ux_mgmt_group_app_accesses_group_app",
                table: "mgmt_user_group_application_accesses",
                columns: new[] { "mgmt_user_groups_id", "mgmt_applications_id" },
                unique: true,
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_user_group_members_deleted_at",
                table: "mgmt_user_group_members",
                column: "deleted_at");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_user_group_members_mgmt_users_id",
                table: "mgmt_user_group_members",
                column: "mgmt_users_id");

            migrationBuilder.CreateIndex(
                name: "ux_mgmt_user_group_members_group_user",
                table: "mgmt_user_group_members",
                columns: new[] { "mgmt_user_groups_id", "mgmt_users_id" },
                unique: true,
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_group_menu_accesses_mgmt_portal_menus_id",
                table: "mgmt_user_group_menu_accesses",
                column: "mgmt_portal_menus_id");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_user_group_menu_accesses_deleted_at",
                table: "mgmt_user_group_menu_accesses",
                column: "deleted_at");

            migrationBuilder.CreateIndex(
                name: "ux_mgmt_group_menu_accesses_group_menu",
                table: "mgmt_user_group_menu_accesses",
                columns: new[] { "mgmt_user_groups_id", "mgmt_portal_menus_id" },
                unique: true,
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_user_groups_deleted_at",
                table: "mgmt_user_groups",
                column: "deleted_at");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_user_groups_department_name",
                table: "mgmt_user_groups",
                columns: new[] { "department", "name" });

            migrationBuilder.CreateIndex(
                name: "ux_mgmt_user_groups_departemen_code_name",
                table: "mgmt_user_groups",
                columns: new[] { "departemen_code", "name" },
                unique: true,
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_users_deleted_at",
                table: "mgmt_users",
                column: "deleted_at");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_users_departemen_code",
                table: "mgmt_users",
                column: "departemen_code",
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_users_department_name",
                table: "mgmt_users",
                columns: new[] { "department", "name" },
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_users_is_active_name",
                table: "mgmt_users",
                columns: new[] { "is_active", "name" },
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_mgmt_users_name",
                table: "mgmt_users",
                column: "name",
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ux_mgmt_users_email",
                table: "mgmt_users",
                column: "email",
                unique: true,
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ux_mgmt_users_employee_number",
                table: "mgmt_users",
                column: "employee_number",
                unique: true,
                filter: "employee_number IS NOT NULL AND deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ix_portal_activities_deleted_at",
                table: "portal_activities",
                column: "deleted_at");

            migrationBuilder.CreateIndex(
                name: "ix_portal_activities_mgmt_applications_id",
                table: "portal_activities",
                column: "mgmt_applications_id");

            migrationBuilder.CreateIndex(
                name: "ix_portal_activities_user_occurred_at",
                table: "portal_activities",
                columns: new[] { "mgmt_users_id", "occurred_at" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "ix_portal_favorites_deleted_at",
                table: "portal_favorites",
                column: "deleted_at");

            migrationBuilder.CreateIndex(
                name: "ix_portal_favorites_mgmt_applications_id",
                table: "portal_favorites",
                column: "mgmt_applications_id");

            migrationBuilder.CreateIndex(
                name: "ux_portal_favorites_user_app",
                table: "portal_favorites",
                columns: new[] { "mgmt_users_id", "mgmt_applications_id" },
                unique: true,
                filter: "deleted_at IS NULL");

            migrationBuilder.CreateIndex(
                name: "ux_portal_notification_settings_mgmt_users_id",
                table: "portal_notification_settings",
                column: "mgmt_users_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_portal_notifications_user_created_at",
                table: "portal_notifications",
                columns: new[] { "mgmt_users_id", "created_at" },
                descending: new[] { false, true });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "audit_data_versions");

            migrationBuilder.DropTable(
                name: "audit_logs");

            migrationBuilder.DropTable(
                name: "mgmt_application_service_credentials");

            migrationBuilder.DropTable(
                name: "mgmt_group_menu_actions");

            migrationBuilder.DropTable(
                name: "mgmt_login_failures");

            migrationBuilder.DropTable(
                name: "mgmt_refresh_tokens");

            migrationBuilder.DropTable(
                name: "mgmt_sso_token_uses");

            migrationBuilder.DropTable(
                name: "mgmt_user_group_application_accesses");

            migrationBuilder.DropTable(
                name: "mgmt_user_group_members");

            migrationBuilder.DropTable(
                name: "mgmt_user_group_menu_accesses");

            migrationBuilder.DropTable(
                name: "portal_activities");

            migrationBuilder.DropTable(
                name: "portal_favorites");

            migrationBuilder.DropTable(
                name: "portal_notification_settings");

            migrationBuilder.DropTable(
                name: "portal_notifications");

            migrationBuilder.DropTable(
                name: "mgmt_portal_menus");

            migrationBuilder.DropTable(
                name: "mgmt_user_groups");

            migrationBuilder.DropTable(
                name: "mgmt_applications");

            migrationBuilder.DropTable(
                name: "mgmt_users");

            migrationBuilder.DropSequence(
                name: "audit_logs_hilo_seq");
        }
    }
}
