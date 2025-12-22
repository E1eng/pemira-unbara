-- FUNGSI: IMPORT DPT (hash token di server)
create or replace function admin_add_voter(
  p_nim text,
  p_name text,
  p_access_code_plain text
) returns void as $$
begin
  if not is_admin() then
    raise exception 'Unauthorized';
  end if;

  insert into voters (nim, name, access_code_hash)
  values (
    p_nim,
    p_name,
    crypt(p_access_code_plain, gen_salt('bf'))
  );

  insert into audit_logs (action, details)
  values ('ADMIN_ACTION', jsonb_build_object('action', 'ADD_VOTER', 'nim', p_nim));
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function admin_add_voter(text, text, text) from public;
grant execute on function admin_add_voter(text, text, text) to authenticated;
