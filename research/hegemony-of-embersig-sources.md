# 헤게모니 오브 엠버시그 전략 가이드 근거 기록

조사일: 2026-11-16. 작성 대상은 `dist/strategy-factions/hegemony-of-embersig.json` 하나이며, 다른 팩션·공용 데이터는 수정하지 않았다. 카드 사실의 기준은 프로젝트가 원본과 대조한 Warcrow Army v0.13.51, Core 1.6.1, `join-metadata.json`이다. 원시 `app-data.specialRules`를 보유 키워드로 사용하지 않았다.

## 실제 읽은 공식 문서

- https://warcrow.com/en/games/warcrow/nation/hegemony-of-embersig — HTTP 200, 본문 확인. 공식 소개는 방어적 보병, 높은 점령 능력, 목표물로 전진해 점유·방어하는 방향을 명시한다. 에스타리 마법, 캐릭터의 높은 COM·스트레스 관리·WP 공유도 본문에 있다. 배경 설정의 ‘최강 군대’ 같은 표현은 승률·성능 평가로 전환하지 않았다. `/en/factions/hegemony-of-embersig`는 404였으며 인용하지 않는다.
- https://warcrow.com/en/news/warcrow-army-hotfix-nov26 — HTTP 200, 제목 `Warcrow Army hotfix - November 2026`, 게시 메타데이터 2026-11-03T13:00:05.000Z. 헤게모니 변경은 `Gunnery Corporal (v2.1): Fixed typo in Spanish.` 한 줄이다. 헤게모니 점수·영문 수치 변경의 근거로 확대하지 않았다. 같은 기사에는 사이언즈에서 레드 캡 10개 프로필 제거가 있으므로 로컬 전체 데이터와 최신 웹 공지가 완전히 같다고 주장할 수 없다. 이 차이는 root에게 전달했다.
- https://experience.corvusbelli.com/en/resources/e89e441f-98af-5417-ba5d-96d9a5be719d?l=712b6686-47e5-479e-a729-80c7af9ce90a — HTTP 200, PDF 응답 확인. 프로젝트의 공식 1.6.1 추출 원문에서 인쇄 25–27쪽 편성/지휘, 73–81쪽 합류를 직접 읽고 명단 검증에 사용했다. 표준전 250점 이하, AVB, 장교 지휘관, 최고 지휘부 최대 한 명, 합류 유닛당 캐릭터 한 명, 합류 캐릭터의 병력 계산·키워드 비공유를 적용했다.
- https://warcrow.com/en/news/wts-season-2 — HTTP 200, 본문 확인. 게시 2026-09-01. 1.6.1 발표와 상태·스트레스·점령 문구 변경 사실을 확인했다. 이번 예시는 `standard`이며 WTS 시즌 점수표를 표준전 공통 득점으로 강제하지 않았다.
- https://warcrow.com/en/news/250-points-lists-ideas — HTTP 200, 본문 확인. 게시 2026-09-04. 여러 팩션의 입문 구매 묶음 예시를 제시하지만 읽은 본문에는 헤게모니 목록이 없었다. 따라서 여기의 두 헤게모니 250점 명단을 해당 기사·공식 추천·대회 리스트로 사칭하지 않았고 `analyst-example`로 표기했다.
- https://warcrow.com/en/blog — HTTP 200으로 `/en/news`에 리다이렉트됨. 뉴스 2~7페이지의 실제 기사 목록을 확인했다. 개발기·Warcrow Adventures 글을 워게임의 현재 전술 규칙으로 섞지 않았다.

## 공식 빌더와 카드

https://www.warcrowarmybuilder.com/builder 는 HTTP 200을 확인했다. 아래 카드 URL도 모두 HTTP 200의 WebP 응답을 실제 조회했다. 문장·수치는 프로젝트의 원본 대조 `native-cards.json`, `card-abilities.json`, `card-effects.json`을 함께 읽어 해석했다. 새 웹 조회만으로 모든 카드의 최신 버전을 재감사했다고 주장하지 않는다.

- `/art/card/hetman_card_en.webp`
- `/art/card/corporal_card_en.webp`
- `/art/card/bulwarks_card_en.webp`
- `/art/card/black_legion_bucklermen_card_en.webp`
- `/art/card/black_legion_arquebusiers_card_en.webp`
- `/art/card/gunnery_corporal_card_en.webp`
- `/art/card/pioneers_card_en.webp`
- `/art/card/dragoslav_bjelogric_drago_the_anvil_card_en.webp`
- `/art/card/war_rig_card_en.webp`
- `/art/card/ansera_noighman_card_en.webp`
- `/art/card/lady_telia_card_en.webp`
- `/art/card/war_surgeon_card_en.webp`
- `/art/card/frostfire_herald_card_en.webp`
- `/art/card/mk-os_automata_card_en.webp`

위 경로의 원본 호스트는 `https://www.warcrowarmybuilder.com`이다. JSON의 sources에는 완전한 URL을 넣었다.

추가로 로컬 공식 원본 이미지 `dist/card-art/mk-os_automata_card_en.webp`를 시각 확인했다. 카드에는 전장 최대 3개, 이동 시 7보폭 안 오토마타 이동 연동, 공간 점유·시야선 차단, 파괴 대상으로 지정 가능, 파괴 시 주황 주사위의 성공에 따른 3보폭 내 모든 진영 대상 피해가 있다. 이 특수 동반자를 0점 독립 활성화/점령 부대로 편성하지 않았다. 로컬 능력 배열이 비어 있다는 이유로 원본의 개별 규칙이 없다고 단정하지 않았다.

## 전략 해석에 중요한 대조 사항

1. 헤트만 독립면의 의지 공유 범위는 12보폭이며 합류면에는 스테디, 솔저스가 있다. 독립 오라를 합류면에 복제하지 않았다. 드라고슬라브도 독립 18보폭 의지 공유와 합류면의 별도 능력을 구분했다.
2. 거너리 코퍼럴 독립면의 조준 오라·코오디네이티드 파이어와 합류면의 슈터스 오피서를 구별했다. 캐릭터 본인의 Aim이나 Scout는 기본 합류 규칙에 따라 자동 공유하지 않는다.
3. 레이디 텔리아의 합류 대상은 아르케뷔지어스 또는 파이오니어스다. 예시의 정찰 배치는 원래 Scout가 있는 파이오니어스를 사용한다.
4. 불워크스는 주변의 다른 비캐릭터 보병·기병 **유닛 수**를, 코퍼럴은 자기 병력과 교전 상대의 **병력 총수**를 센다. 두 계산을 합치지 않았다.
5. 워 리그는 W 8, 기본 점령 0. 안세라 합류의 수리 판정·MOV 교체·공격 보정과 별도로 판단했다. Manned를 모든 스트레스 면역으로 쓰지 않았다.
6. 나에르곤은 나이라 없는 중대에 추가할 수 없다. 15점 단독 지원 마법사로 추천하지 않았다. 상세 카드가 없는 이스마일의 전투 수치를 창작하지 않았다.
7. 파이오니어스 모타르는 시야선 불필요지만 12보폭·비교전 대상 요건이 있다. 주황 주사위 추가에도 같은 색 세 개 상한을 적용한다. 후속 ‘원거리 공격’을 추가 ‘능력 수행’으로 바꿔 읽지 않았다.

## 실제 읽은 영상 자막

- 제목: New to Warcrow? Start Here! - What Faction to Play 2025
- 채널: WatermelonWargames
- URL: https://www.youtube.com/watch?v=dchC5UIjcjs
- 게시일: 2025-12-21, root가 조회한 메타데이터 기준.
- 열람: root가 확보해 공유한 `/tmp/warcrow-strategy-dchC5UIjcjs.json`의 2:12–5:59 헤게모니 구간. 원문 자막은 저장소에 복사하지 않았다.
- 요지: 전문 유닛과 지휘/점령을 묶는 방어 성향, 드라고슬라브의 지원, 어그레서스와 워 서전, 워 리그를 돌파에 쓰고 다른 유닛으로 임무를 수행하는 역할 분담.
- 한계: 2025년의 제작자 입문 의견이며 1.6.1 이전이다. ‘많이 쓰인다’는 표현을 검증된 채택률로 확장하지 않았다. 드라고슬라브의 ‘팀 전체 의지 공유’ 설명에는 현 카드의 범위·합류면 제한을 보충했다. 승률·티어·우승 근거로 사용하지 않았다.

## 커뮤니티·대회 접근 한계

Bing RSS는 HTTP 200이었으나 여러 쿼리에 동일한 일반 Warcrow 결과 또는 무관 결과를 반환해 독립적인 전술 근거로 채택하지 않았다. Goonhammer 검색은 HTTP 403으로 읽지 못했으며 우회하지 않았다. Reddit 검색 URL은 HTTP 200이었지만 읽을 수 있는 본문이 `Reddit` 한 단어뿐이어서 게시글·댓글을 읽었다고 주장하지 않는다. 실제 입상 명단이나 대회 성적은 확보하지 못했다.

## 예시와 검증 기준

- 입문형: 250점 / COM 6 / 최고 지휘부 헤트만 한 명. 코퍼럴→첫 버클러맨만 배치 합류하며 독립 헤트만·거너리 코퍼럴의 지원을 사용한다.
- 심화형: 250점 / COM 5 / 최고 지휘부 드라고슬라브 한 명. 드라고슬라브→불워크스, 레이디 텔리아→파이오니어스, 안세라→워 리그, 워 서전→버클러맨.
- 두 목록 모두 헤게모니로 필터한 유닛 ID·수량·AVB·지휘관 장교·최고 지휘부 제한·중복 없는 합류 조건으로 검산한다. 공식 추천·대회 우승 명단이 아닌 프로필 기반 연습용 제안이다.

실행 검증 완료: JSON parse, 헤게모니 진영 유닛 ID, 모든 sourceIds 참조, 두 명단의 250점/COM6·5, AVB, 최고 지휘부 각 한 명, 장교 지휘관, validateRosterPayload 및 validateJoins 모두 통과했다. 신규 명단은 첫째 모집 10유닛/합류1, 둘째 모집9유닛/합류4로 확인했다.
