-- ============================================================
-- L'OXYGÈNE — 실시간 채팅 messages 테이블
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

CREATE TABLE IF NOT EXISTS messages (
  id          BIGSERIAL   PRIMARY KEY,
  room_id     TEXT        NOT NULL,
  user_id     TEXT,
  nickname    TEXT        NOT NULL DEFAULT '게스트',
  content     TEXT        NOT NULL,
  type        TEXT        NOT NULL DEFAULT 'chat'
                CHECK (type IN ('chat', 'system', 'gift_bouquet', 'gift_champagne')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_room ON messages (room_id, created_at DESC);

-- Realtime 활성화 (Supabase 대시보드 Database > Replication 에서도 활성화 필요)
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능
CREATE POLICY "anyone_read" ON messages FOR SELECT USING (true);

-- 누구나 쓰기 가능 (로그인 불필요)
CREATE POLICY "anyone_insert" ON messages FOR INSERT WITH CHECK (true);
