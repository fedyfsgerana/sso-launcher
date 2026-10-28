using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SsoLauncher.Infrastructure.Persistence.Migrations
{
    public partial class PartitionAuditLogs : Migration
    {
        private const string ColumnDefinitions =
            """
            audit_logs_id bigint NOT NULL,
            actor_id bigint,
            actor_name character varying(150) NOT NULL,
            action character varying(30) NOT NULL,
            outcome character varying(20) NOT NULL DEFAULT 'success',
            target_type character varying(50) NOT NULL,
            target_id bigint,
            target_name character varying(200) NOT NULL,
            summary character varying(500) NOT NULL,
            reason character varying(500),
            changes jsonb,
            ip_address character varying(64),
            user_agent character varying(512),
            browser character varying(60),
            browser_version character varying(40),
            operating_system character varying(60),
            device_type character varying(20),
            device_name character varying(255),
            session_ref character varying(32),
            request_id character varying(100),
            http_method character varying(10),
            request_path character varying(300),
            occurred_at timestamp with time zone NOT NULL,
            CONSTRAINT pk_audit_logs PRIMARY KEY (audit_logs_id, occurred_at),
            CONSTRAINT fk_audit_logs_mgmt_users_actor FOREIGN KEY (actor_id)
                REFERENCES mgmt_users (mgmt_users_id) ON DELETE SET NULL
            """;

        private const string Indexes =
            """
            CREATE INDEX ix_audit_logs_action ON audit_logs (action);
            CREATE INDEX ix_audit_logs_actor_id_occurred_at ON audit_logs (actor_id, occurred_at);
            CREATE INDEX ix_audit_logs_actor_name ON audit_logs (actor_name);
            CREATE INDEX ix_audit_logs_occurred_at ON audit_logs (occurred_at);
            CREATE INDEX ix_audit_logs_target_name ON audit_logs (target_name);
            CREATE INDEX ix_audit_logs_target_type_target_id ON audit_logs (target_type, target_id);
            """;

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                $"""
                DROP TABLE audit_logs;

                CREATE TABLE audit_logs (
                    {ColumnDefinitions}
                ) PARTITION BY RANGE (occurred_at);

                CREATE TABLE audit_logs_default PARTITION OF audit_logs DEFAULT;

                {Indexes}
                """
            );

            migrationBuilder.Sql(
                """
                CREATE OR REPLACE FUNCTION audit_logs_ensure_partitions(
                    start_at timestamp with time zone,
                    months_ahead integer)
                RETURNS integer
                LANGUAGE plpgsql
                AS $$
                DECLARE
                    month_start timestamp := date_trunc('month', LEAST(start_at, now()) AT TIME ZONE 'UTC');
                    last_month timestamp := date_trunc('month', now() AT TIME ZONE 'UTC') + make_interval(months => months_ahead);
                    partition_name text;
                    created integer := 0;
                BEGIN
                    WHILE month_start <= last_month LOOP
                        partition_name := 'audit_logs_' || to_char(month_start, 'YYYY_MM');

                        IF to_regclass(partition_name) IS NULL THEN
                            EXECUTE format(
                                'CREATE TABLE %I PARTITION OF audit_logs FOR VALUES FROM (%L) TO (%L)',
                                partition_name,
                                month_start AT TIME ZONE 'UTC',
                                (month_start + interval '1 month') AT TIME ZONE 'UTC'
                            );

                            created := created + 1;
                        END IF;

                        month_start := month_start + interval '1 month';
                    END LOOP;

                    RETURN created;
                END;
                $$;
                """
            );

            migrationBuilder.Sql(
                """
                CREATE OR REPLACE FUNCTION audit_logs_drop_partitions_before(
                    cutoff timestamp with time zone)
                RETURNS integer
                LANGUAGE plpgsql
                AS $$
                DECLARE
                    item record;
                    upper_bound timestamp with time zone;
                    dropped integer := 0;
                BEGIN
                    FOR item IN
                        SELECT child.relname
                        FROM pg_inherits
                        JOIN pg_class parent ON parent.oid = pg_inherits.inhparent
                        JOIN pg_class child ON child.oid = pg_inherits.inhrelid
                        WHERE parent.relname = 'audit_logs'
                          AND child.relname ~ '^audit_logs_[0-9]{4}_[0-9]{2}$'
                    LOOP
                        upper_bound :=
                            (to_date(substring(item.relname FROM 12), 'YYYY_MM') + interval '1 month')::timestamp
                            AT TIME ZONE 'UTC';

                        IF upper_bound <= cutoff THEN
                            EXECUTE format('DROP TABLE %I', item.relname);
                            dropped := dropped + 1;
                        END IF;
                    END LOOP;

                    RETURN dropped;
                END;
                $$;
                """
            );

            migrationBuilder.Sql("SELECT audit_logs_ensure_partitions(now(), 3);");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                $"""
                DROP TABLE audit_logs;
                DROP FUNCTION IF EXISTS audit_logs_ensure_partitions(timestamp with time zone, integer);
                DROP FUNCTION IF EXISTS audit_logs_drop_partitions_before(timestamp with time zone);

                CREATE TABLE audit_logs (
                    {ColumnDefinitions}
                );

                {Indexes}
                """
            );
        }
    }
}
