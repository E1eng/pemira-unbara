-- FUNGSI 4: VALIDASI LOGIN TANPA EFEK SAMPING
create or replace function validate_voter(
  p_nim text,
  p_access_code_plain text
) returns jsonb as $$
declare
  v_voter voters%rowtype;
begin
  select * into v_voter from voters where nim = p_nim;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'NIM tidak terdaftar dalam DPT.');
  end if;

  if v_voter.access_code_hash != crypt(p_access_code_plain, v_voter.access_code_hash) then
    return jsonb_build_object('ok', false, 'reason', 'Kode Akses salah.');
  end if;

  if v_voter.has_voted then
    return jsonb_build_object('ok', false, 'reason', 'NIM ini sudah digunakan untuk memilih.');
  end if;

  return jsonb_build_object('ok', true, 'has_voted', v_voter.has_voted);
end;
$$ language plpgsql security definer set search_path = public;

revoke all on function validate_voter(text, text) from public;
grant execute on function validate_voter(text, text) to anon, authenticated;
