import Anthropic from '@anthropic-ai/sdk';
import { getCamp, listCamps, listStories } from '../server/camps.js';
import { getCondition } from '../server/condition.js';
import { getForecast } from '../server/weather.js';
import { searchHeritage } from '../server/heritage.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-5-5';

// ── 비용·폭주 방지 장치 — 지우지 마세요 ─────────────────────
// 무한 반복 버그 하나가 예산을 다 쓸 수 있어서, 도구 호출 루프 횟수·답 길이·보내는 대화 기록 수를 모두 제한합니다.
const MAX_TURNS = 5;        // 에이전트 루프 상한
const MAX_TOKENS = 1024;    // 답 길이 상한
const MAX_HISTORY = 10;     // 보내는 대화 기록 수 (최근 10개)

// ① 도구 설명서: Claude는 이 설명만 보고 "어떤 도구를 언제 쓸지" 결정한다
const tools = [
  {
    name: 'list_camps',
    description: '한국관광공사 고캠핑 데이터로 제주 캠핑장 목록(유형·지역·반려동물 가능 여부·좌표)과 가까운 오름·신화 스토리를 조회한다',
    input_schema: {
      type: 'object',
      properties: {
        keyword: { type: 'string', description: '이름·주소 검색어' },
        region: { type: 'string', enum: ['제주시', '서귀포시'] },
        type: { type: 'string', enum: ['normal', 'car', 'glamp', 'caravan'], description: '일반야영 / 자동차야영 / 글램핑 / 카라반' },
      },
    },
  },
  {
    name: 'get_camp_detail',
    description: '캠핑장 하나의 상세, 근처 오름·신화 스토리, 한국관광공사 TourAPI 주변 장소를 조회한다',
    input_schema: { type: 'object', properties: { campId: { type: 'string' } }, required: ['campId'] },
  },
  {
    name: 'list_oreum_stories',
    description: '제주 오름·신화·화산 스토리 스팟 목록을 조회한다 (tag: myth 신화, oreum 오름, volcano 화산)',
    input_schema: {
      type: 'object',
      properties: { tag: { type: 'string', enum: ['myth', 'oreum', 'volcano'] }, area: { type: 'string', enum: ['제주시', '서귀포시'] } },
    },
  },
  {
    name: 'get_camp_condition',
    description: '기상청 단기예보(풍속·풍향·강수), 에어코리아 미세먼지, 천문연구원 일몰 시간, 달 밝기로 제주시/서귀포시의 오늘 캠핑 컨디션을 조회한다',
    input_schema: {
      type: 'object',
      properties: { place: { type: 'string', enum: ['제주시', '서귀포시'] } },
      required: ['place'],
    },
  },
  {
    name: 'get_forecast',
    description: '기상청 단기예보로 제주시/서귀포시의 오늘부터 최대 3일간 날짜별 최대 풍속·풍향·강수확률·기온을 조회한다. "이번 주말/내일/모레 어디가 좋아?" 같은 날짜 질문에 쓴다',
    input_schema: {
      type: 'object',
      properties: { place: { type: 'string', enum: ['제주시', '서귀포시'] } },
      required: ['place'],
    },
  },
  {
    name: 'search_heritage',
    description: '국가유산청 API로 제주의 국가유산(문화재)을 이름으로 검색한다. 이야기 소재용',
    input_schema: { type: 'object', properties: { keyword: { type: 'string' } } },
  },
  {
    // 화면에 보여 줄 최종 답. 글이 아니라 "짧은 안내 + 캠핑장 목록"으로 받아서 화면이 목록·링크로 그립니다.
    name: 'answer',
    description: '사용자에게 보여 줄 최종 답을 제출한다. 필요한 조회를 마친 뒤 반드시 마지막에 이 도구로 답한다. message 는 1~2문장의 짧은 안내, camps 는 추천하는 캠핑장 목록이다(다른 도구 결과에 있는 campId 만, 최대 5개). 캠핑장을 추천하는 질문이 아니면 camps 는 비운다.',
    input_schema: {
      type: 'object',
      properties: {
        message: { type: 'string', description: '1~2문장 안내(하르방 말투). 추천 캠핑장 이름을 문장에 나열하지 않는다 — 목록은 camps 에 넣는다' },
        camps: {
          type: 'array', maxItems: 5,
          items: {
            type: 'object',
            properties: {
              campId: { type: 'string', description: 'list_camps/get_camp_detail 결과의 id' },
              note: { type: 'string', description: '이 캠핑장을 고른 이유 한 줄(30자 안팎). 도구 결과에 있는 사실만' },
            },
            required: ['campId', 'note'],
          },
        },
      },
      required: ['message'],
    },
  },
];

const LANG_NAME = { ko: '한국어', en: 'English', zh: '简体中文', ja: '日本語' };

// ② 도구 이름 → 실제 실행할 함수 (lang 은 서버에서 붙여 줍니다)
const makeRunTool = (lang) => ({
  list_camps: (a) => listCamps({ ...a, lang }),
  get_camp_detail: (a) => getCamp({ id: a.campId, lang }),
  list_oreum_stories: (a) => listStories({ ...a, lang }),
  get_camp_condition: getCondition,
  get_forecast: getForecast,
  search_heritage: searchHeritage,
});

const system = (lang) => `너는 '하르방 campmate'의 캐릭터 '하르방이'(돌하르방)다. 바람을 읽어 캠핑장을 고르고, 근처 오름·신화 이야기를 들려준다.
- 캠핑장·날씨·바람·일몰·유산 정보는 반드시 도구로 확인한 뒤 답한다. 도구 결과에 없는 장소·수치·시설은 지어내지 않는다.
- 캠핑장 데이터의 source 가 'sample' 이면 실제 업체가 아닌 가상 예시이므로, 실제 추천처럼 말하지 말고 샘플이라고 밝힌다.
- 바람 등급 기준(경험칙, 공식 안전 기준 아님): 4m/s 미만 잔잔, 4~7 산들바람, 7~10 강풍 주의, 10 이상 텐트 위험.
- 일반야영은 강풍 주의부터 비추천, 자동차야영은 위험 단계에서 비추천, 글램핑·카라반은 비교적 바람에 강하다. 위험하면 날짜 변경이나 실내형 숙소도 제안한다.
- 날짜가 있는 질문(내일·모레·주말)은 get_forecast 로 날짜별 풍속을 확인한다. 예보는 오늘부터 최대 3일치뿐이라, 그 너머 날짜는 예보가 없다고 말한다.
- 비 예보나 미세먼지가 나쁘면 함께 알려 준다.
- 예약·연락처를 물으면 도구 결과의 tel(전화), resveUrl(온라인 예약), homepage, reserve(예약 방식)만 그대로 알려 준다. 값이 비어 있으면 "등록된 정보가 없다"고 말하고 번호나 주소를 지어내지 않는다. 요금·예약 가능 여부는 직접 확인하라고 덧붙인다.
- 캠핑장을 추천할 때는 가까운 오름·신화 스토리 한 가지를 곁들여 짧게 들려준다.
- 최종 답은 반드시 answer 도구로 제출한다(글로 바로 답하지 않는다). message 는 친근하고 약간 익살스러운 하르방 말투의 **딱 1문장**(길어도 2문장) 안내이고, 캠핑장 추천은 camps 목록에 넣는다. 예: "오늘 바람이 약한 곳은 서귀포시 쪽이구나." + camps 3~5개. 질문에서 묻지 않은 이야기·미세먼지·예약 안내는 message 에 덧붙이지 않는다(이야기는 note 에 "산방산 3.9km"처럼 짧게).
- camps 에는 도구 결과에 있는 campId 만 넣고, 각 note 는 그 캠핑장의 특징·근처 이야기 같은 도구 결과의 사실을 30자 안팎으로 쓴다. 지역과 유형(일반야영·글램핑 등)은 화면에 따로 표시되므로 note 에 쓰지 않는다. 추측(예: "숲이 바람막이가 된다")은 쓰지 않는다.
- 예약·연락처 질문처럼 캠핑장 목록이 필요 없는 질문은 camps 를 비우고 message 에 2문장 이내로 답한다.
- 화면이 마크다운을 렌더링하지 않으므로 **굵게**, #, 목록 기호를 쓰지 않는다.
- 반드시 ${LANG_NAME[lang] ?? LANG_NAME.ko}로 답한다.`;

// answer 도구 입력 → 화면용 응답. 추천 캠핑장은 실제 데이터에 있는 id 만 남깁니다(모델이 없는 id 를 지어내도 걸러짐).
async function shapeAnswer(input = {}, lang, steps) {
  const all = await listCamps({ lang });
  const byId = new Map(all.map((c) => [c.id, c]));
  const camps = (Array.isArray(input.camps) ? input.camps : []).slice(0, 5).flatMap((x) => {
    const c = byId.get(String(x?.campId));
    return c ? [{ id: c.id, name: c.name, region: c.region, types: c.types, note: String(x.note ?? '').slice(0, 80) }] : [];
  });
  return { answer: String(input.message ?? ''), camps, steps };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const { message, history = [], lang = 'ko' } = req.body ?? {};
  const runTool = makeRunTool(lang);
  const messages = [...history.slice(-MAX_HISTORY), { role: 'user', content: message }]; // 최근 10개만 보내 비용 절약
  const steps = []; // 화면에 "에이전트가 무엇을 했는지" 보여주기용

  try {
    // ③ 에이전트 루프: 생각 → 도구 호출 → 결과 확인 → (반복) → 최종 답
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const r = await client.messages.create({
        model: MODEL, max_tokens: MAX_TOKENS, system: system(lang), tools, messages,
        // 마지막 차례에는 조회를 더 못 하게 하고 answer 로 답하게 강제 (상한에 걸려 답 없이 끝나는 것을 막음)
        tool_choice: turn === MAX_TURNS - 1 ? { type: 'tool', name: 'answer' } : { type: 'auto' },
      });

      // 최종 답(answer 도구) — 다른 도구 호출이 같이 와도 답을 우선합니다
      const done = r.content.find((b) => b.type === 'tool_use' && b.name === 'answer');
      if (done) return res.status(200).json(await shapeAnswer(done.input, lang, steps));

      if (r.stop_reason !== 'tool_use') {   // answer 도구 없이 글로 답한 경우 — 글 그대로 보여 줌
        const answer = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
        return res.status(200).json({ answer, camps: [], steps });
      }

      messages.push({ role: 'assistant', content: r.content });
      const results = [];
      for (const block of r.content) {
        if (block.type !== 'tool_use') continue;
        let result;
        try { result = await runTool[block.name](block.input ?? {}); }
        catch (e) { result = { error: e.message }; }
        steps.push({ tool: block.name, args: block.input, count: Array.isArray(result) ? result.length : 1 });
        results.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
      }
      messages.push({ role: 'user', content: results });
    }
    res.status(200).json({ answer: '도구 호출이 너무 많아 중단했어요. 질문을 좁혀 주세요.', camps: [], steps });
  } catch (e) {
    res.status(e.status ?? 500).json({ error: e.status === 429 ? '사용량이 많아요. 1분 뒤 다시 시도하세요.' : e.message });
  }
}
