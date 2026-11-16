# 시예난 전략 가이드 조사 기록

조사일: 2026-11-16. 작성 범위: 시예난의 공식 프로필 기반 전술과 학습 편성. 승률, 우승 명단, 대회 메타를 확인했다고 주장하지 않는다.

## 읽은 공식 본문

- https://warcrow.com/en/games/warcrow/nation/syenann — 200, 진영 소개 본문 읽음. 구 명칭 및 홍보상의 최강 표현을 최신 규칙이나 승률로 사용하지 않음.
- https://warcrow.com/en/news/250-points-lists-ideas — 200, 2026-09-04 공식 입문 리스트 본문 읽음. Action Pack170 + Curtailers35 + Officers45=250, Action Pack170 + Wardens40 + Sprigs35=245. 아래 예시는 대회 실적 리스트가 아님.
- https://warcrow.com/en/news/warcrow-update-june-2026 — 200, 2026-06-10 아오이도스 v3.0 주문 변경 확인. 호드·400점은 당시 비공식 대회용이라는 구분 확인.
- https://warcrow.com/en/news/warcrow-army-hotfix-nov26 — 200, 2026-11-03 변경 본문 확인. 시예난의 새 변경으로 해석하지 않음.
- https://warcrow.com/en/news/syenann 및 /en/news/syenann-society — 200, 2022년 배경 본문 읽음. 게임 규칙 근거로 사용하지 않음.
- https://warcrow.com/en/news/mounted-units — 200, 2026-06-30 클라우디드·에칸 소개 본문 읽음. 해당 글의 배경 설명을 기병의 실제 능력 대신 사용하지 않음.
- https://warcrow.com/en/news?page=2 부터 page=7까지 목록 확인하여 시예난 및 현행 규칙 기사 탐색. /en/blog는 /en/news로 이동하여200.

## 공식 상점

https://store.corvusbelli.com/en/warcrow/wargame/miniatures/syenann-action-pack 및 syenann-officers는200이나 일반 HTML이 동적 셸이다. 같은 공식 상점 공개 GraphQL의 getProduct(slug,lang:en,cartId:"")로 Action Pack, Officers, Grove Curtailers, Syena Wardens, Sprigs의 name/desc를 직접 확인했다. 공개 브라우저에 제공되는 상품 데이터만 사용했다.

Action Pack의 10미니어처 = Druid1 + Ynyr1 + Protectors4 + Aoidos1 + Lioslaith1 + Shadows2. 현행 단위 비용 25+35+25+20+30+35=170. 상품 홍보 문구는 상세 룰을 대체하지 않는다. 예를 들어 커테일러스의 무장 해제 거리는 실제 카드에서 자신 기준7보폭 조건으로 확인했다.

## 프로필·규칙 검증

프로젝트 dist/app-data.json v0.13.51, card-ko.json, join-metadata.json, native-cards.json, card-abilities.json, card-effects.json 및 Core1.6.1 한국어 전문·영문 페이지 데이터를 읽었다. 공식 빌더 셸200 및 JSON sources에 나열한 공식 카드17개의 공개 URL200을 확인했다. 그랜드 캡틴·워든 캡틴·드루이드 원본 이미지는 직접 시각 대조했다. 능력 해석은 공식 추출 데이터와 카드 내용을 함께 사용했다.

주요 검증점:

- 프로텍터스·커테일러스에는 기본 네모러스 특성이 없음.
- 그랜드 캡틴의 기본 Ambushing Tactics는 Permanent이므로 Core1.6.1 p57에 따라 합류 후에도 유지된다. 합류 프로필의 We Are One... 네모러스 부여와 함께 적용할 수 있다. 초안에서 사라진다고 쓴 오류를 바로잡고 관련 전술·로스터·실수 항목 전체를 수정했다.
- 워든 캡틴 기본 Strengthen the Shadows와 합류 중 Slippery는 동시 적용 아님.
- Lioslaith의 합류 프로필에 돌격·강습 시 취약 및 최대2개 공격 주사위 재굴림이 명시됨. 캐릭터 정예 키워드의 자동 공유로 설명하지 않음.
- 지휘 능력은 행동 대신COM1, 시작합계 제한과 비회복.
- Druid 숲의7보폭 정사각형 제한, 궁병의5/4, 커테일러스의7, GrandCaptain 재배치의각대상7, WardenCaptain합류Slippery8을 구분.
- 워커의 지속2턴은2라운드가 아님. 제거 중 목표물을 다툴 수 없음.
- 스프리그스의 별도 교전·둔화 구속과 일반 둔화 상태를 구분.
- 네카일 원본 카드·장교지원 유형 미확인: 상세 수치·능력·지휘관 추천 제외.

로스터 검산:

1.245점: Druid25+Ynyr35+Protectors25+Aoidos20+Lioslaith30+Shadows35+Wardens40+Sprigs35. 초기COM3. Lioslaith장교/하이커맨드1명이 자동지휘관, Shadows는 Infantry+Syenann 합류조건 충족. Aoidos는독립. 금지유닛/용병없음.
2.250점: GrandCaptain30+Wardens40+WardenCaptain30+Protectors25+Curtailers35+Clouded30+Walker25+Sprigs35. 초기COM5. GrandCaptain장교/하이커맨드1명자동지휘관. WardenCaptain→Wardens명시대상합류. GrandCaptain독립. 금지유닛/용병없음.

두 예시는 analyst-example이며 공식 우승 명단이 아니다. 모든 수량이 AVB이하이고 한 대상에 캐릭터가 둘 이상 들어가지 않는다. 기본편성에 임의의 최소 유닛 수 규칙을 추가하지 않았다.

## 공개 커뮤니티 조사 한계

Bing RSS로 Warcrow Syenann strategy/tournament 검색을 시도했지만 일반 소개 또는 무관한 결과가 대부분이었다. 검색 결과를 전술 본문으로 읽었다고 쓰지 않았다. Reddit https://www.reddit.com/r/WarCrow/search/?q=syenann&restrict_sr=1 은403으로 본문 미열람. 대회 리스트·승률·커뮤니티 의견을 창작하지 않았다. 영상은 root에서 일괄 확보한 뒤 아래 시예난 구간을 실제 읽고 현재 카드와 대조했다.

## 확보 영상의 실제 자막 검토

- https://www.youtube.com/watch?v=dchC5UIjcjs — WatermelonWargames, 「New to Warcrow? Start Here! - What Faction to Play 2025」, 2025-12-21. root가 확보한 /tmp/warcrow-strategy-dchC5UIjcjs.json 자막의11:03~17:45를 읽음. 자동자막의 canon/CNN/Seanon 등은 시예난 이름 인식 오류.
- 제작자의 유격·지형 연결·여러 목표에 압박한다는 평가와 Druid+Shadows 입문축, Hawthorn통제, Walker재투입 의견을 community 섹션에 귀속하여 요약. 원문 자막을 저장소에 복사하지 않음.
- pre1.6 자료. 가장높은평균이동/가장복잡한진영은 통계로확인안해 채택하지않음. Walker를 단순히COM1로전부순간이동하는기술이라요약하지않고,현행주문시전과복귀후COM활성화를분리.25보폭호손위협범위의 일반보장도 주장하지않음.
- 추가 official syenann_captain/eachann/moss_hermit 카드URL도200확인.

## 후속 규칙 감사

Core1.6.1 p57을 다시 읽어 Grand Captain의 Permanent 기본능력은 합류 후에도 유지됨을 바로잡았다. 독립운용 이유를 능력보존이 아닌 별도활성화·자체전투선택으로 수정. Wardencaptain 기본 Dauntless능력은 Permanent가 아니므로 합류 후 자동유지되는 예외와 구분했다. p103에 따라 목표물을 떠나도 획득한 지배권은 상대가 가져갈 때까지 유지됨을 후반·중반 설명에 명시했다.
