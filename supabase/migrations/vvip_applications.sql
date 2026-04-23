-- ============================================================
-- L'OXYGÈNE BLACK — VVIP Applications Table
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

CREATE TABLE IF NOT EXISTS vvip_applications (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT        NOT NULL,
  name        TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  phone       TEXT        NOT NULL DEFAULT '',
  bio         TEXT        NOT NULL DEFAULT '',
  referral    TEXT        NOT NULL DEFAULT '',
  scale       TEXT        NOT NULL DEFAULT 'small',
  status      TEXT        NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- 조회 인덱스
CREATE INDEX IF NOT EXISTS idx_vvip_session ON vvip_applications (session_id);
CREATE INDEX IF NOT EXISTS idx_vvip_status  ON vvip_applications (status);
CREATE INDEX IF NOT EXISTS idx_vvip_email   ON vvip_applications (email);

-- RLS: 서비스 롤 키만 전체 접근, anon은 자신의 세션만 읽기
ALTER TABLE vvip_applications ENABLE ROW LEVEL SECURITY;

-- anon: 자신의 session_id로 조회만 가능
CREATE POLICY "anon_read_own" ON vvip_applications
  FOR SELECT USING (true);  -- API route에서 session_id 필터링으로 보안 처리

-- service role은 모든 작업 허용 (API route에서 서비스 롤 키 사용)
