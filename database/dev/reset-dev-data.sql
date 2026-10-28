\set ON_ERROR_STOP on

BEGIN;

CREATE TEMP TABLE keep_user ON COMMIT DROP AS
SELECT mgmt_users_id AS id
FROM mgmt_users
WHERE email = :'keep_user';

CREATE TEMP TABLE keep_group ON COMMIT DROP AS
SELECT mgmt_user_groups_id AS id
FROM mgmt_user_groups
WHERE name = :'keep_group';

DO $$
BEGIN
    IF (SELECT count(*) FROM keep_user) <> 1 THEN
        RAISE EXCEPTION 'Pengguna yang dipertahankan tidak ditemukan.';
    END IF;

    IF (SELECT count(*) FROM keep_group) <> 1 THEN
        RAISE EXCEPTION 'Grup yang dipertahankan tidak ditemukan.';
    END IF;
END $$;

DELETE FROM audit_data_versions;
DELETE FROM audit_logs;
DELETE FROM mgmt_sso_token_uses;
DELETE FROM mgmt_login_failures;
DELETE FROM portal_notifications;
DELETE FROM portal_favorites;
DELETE FROM portal_activities;
DELETE FROM mgmt_application_service_credentials;
DELETE FROM mgmt_user_group_application_accesses;
DELETE FROM mgmt_applications;

DELETE FROM portal_notification_settings
WHERE mgmt_users_id NOT IN (SELECT id FROM keep_user);

DELETE FROM mgmt_refresh_tokens
WHERE mgmt_users_id NOT IN (SELECT id FROM keep_user);

DELETE FROM mgmt_group_menu_actions
WHERE mgmt_user_groups_id NOT IN (SELECT id FROM keep_group);

DELETE FROM mgmt_user_group_menu_accesses
WHERE mgmt_user_groups_id NOT IN (SELECT id FROM keep_group);

DELETE FROM mgmt_user_group_members
WHERE mgmt_user_groups_id NOT IN (SELECT id FROM keep_group)
   OR mgmt_users_id NOT IN (SELECT id FROM keep_user);

DELETE FROM mgmt_user_groups
WHERE mgmt_user_groups_id NOT IN (SELECT id FROM keep_group);

DELETE FROM mgmt_users
WHERE mgmt_users_id NOT IN (SELECT id FROM keep_user);

UPDATE mgmt_users
SET deleted_at = NULL,
    deleted_by_id = NULL,
    deleted_by_name = NULL,
    delete_reason = NULL,
    is_active = TRUE
WHERE mgmt_users_id IN (SELECT id FROM keep_user);

UPDATE mgmt_user_groups
SET deleted_at = NULL,
    deleted_by_id = NULL,
    deleted_by_name = NULL,
    delete_reason = NULL,
    is_active = TRUE
WHERE mgmt_user_groups_id IN (SELECT id FROM keep_group);

DELETE FROM mgmt_user_group_members
WHERE deleted_at IS NOT NULL;

INSERT INTO mgmt_user_group_members (mgmt_user_groups_id, mgmt_users_id, created_at)
SELECT g.id, u.id, now()
FROM keep_group g
CROSS JOIN keep_user u
WHERE NOT EXISTS (
    SELECT 1
    FROM mgmt_user_group_members m
    WHERE m.mgmt_user_groups_id = g.id
      AND m.mgmt_users_id = u.id
);

COMMIT;

SELECT
    (SELECT count(*) FROM mgmt_users) AS pengguna,
    (SELECT count(*) FROM mgmt_user_groups) AS grup,
    (SELECT count(*) FROM mgmt_applications) AS aplikasi,
    (SELECT count(*) FROM mgmt_portal_menus) AS menu_portal;
