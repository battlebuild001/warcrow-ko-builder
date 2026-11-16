# 사이언즈 오브 얄다바오트 전략 가이드 조사 기록

조사일: 2026-11-16. 범위: 현재 앱의 사이언즈 자료와 공식 Core Rules 1.6.1, 2026-11-03 소속 변경. 작성 파일은 `dist/strategy-factions/scions-of-yaldabaoth.json`이며, 이 기록과 그 파일만 작성했다.

## 우선 확인한 최신 변경

- 공식 2026-11-03 **Warcrow Army hotfix - November 2026** 본문을 HTTP 200으로 직접 읽었다. 사이언즈에서 Bugbowls, Crucible, Flamecobs, Gobblers, Nuada, Osseous, Overseer, Rumpy Ride, Sightless, Stompers 10개 프로필 제거를 명시한다.
- 2026-10-22 **Warcrow Red Caps Update - October 2026**도 HTTP 200으로 직접 읽었다. 독립 Red Caps 신설 뒤 임시 중복 소속이 11월 3일까지였음을 명시한다.
- 공식 진영 소개 페이지는 현재도 Nuada and the Red Caps 세계관 항목을 담고 있다. 이것을 현행 편성 허가로 해석하지 않았다. 가이드의 실제 역할·시너지·로스터는 제거된 10개 프로필을 사용하지 않는다.

## 공식 카드와 로컬 검증 자료

읽은 로컬 자료: app-data.json(v0.13.51), native-cards.json, card-abilities.json, card-effects.json, join-metadata.json, card-ko.json, rulebook-core-a~d.json, rules-glossary.json.

14개 유닛의 공식 카드 URL을 실제 내려받아 HTTP 200과 SHA-256을 확인했다. 모두 dist/card-art의 기존 검증 원본과 바이트 해시가 일치했다: Anointed, Intact, Marked, Progenitor Sculptor, Tutor, Needle, Liberated, Harvester Riders, Master Nepharim, Master Maiele, Puppeteer, Harvester, Husks, Echoes. 비용과 AVB·COM은 앱 데이터와 검증 카드 자료에서 확인했고, 능력은 능력/스위치 JSON 및 합류 메타데이터를 대조했다. 이번 작업에서 Husks, Master Nepharim, Progenitor Sculptor, Needle, Puppeteer 원본은 이미지로도 직접 다시 확인했다.

중요한 조건:

- 프로제니터 스컬프터는 정리된 카드에 Join(Infantry)로 표시된다. raw app-data의 과거 Living Flesh 조건을 그대로 사용하지 않았다.
- 네파림은 Join(Infantry, Dead Flesh)이고 허스크스 카드에는 Infantry, Risen이 표시된다. 이름이 비슷하다는 이유로 Dead Flesh를 추가하지 않았다. 두 번째 예시에는 합류를 지정하지 않았다.
- 허스크스는 초기 병력 4, AVB 3, 병력 3+에서 점령 1 / 2-에서 점령 0이다. 퍼피티어의 7보폭 점령 지원과 원래 패널을 구분했다.
- 마크드의 임플란트 선택은 배치 시 하나이며 해당 캐릭터가 실제 목록에 있어야 한다. 선택된 캐릭터와 합류한 캐릭터가 같아야 한다는 조건을 임의로 추가하지 않았다.
- 허스크스 Returned는 command 유형이다. 비르투오소의 팅지 1뿐 아니라 지휘 토큰을 사용한다. 네파림의 카드 아래에 임의로 모든 라이즌을 쌓을 수 없고 하베스터의 실제 Returned를 전제로 설명했다.
- 팅지 골렘은 피해 토큰 배치를 팅지 소모로 대신하되 여전히 피해를 받은 것으로 간주한다. 팅지 획득마다 전용 표를 굴리는 것으로 설명하지 않았다.

## 연습용 로스터 검증

대회 결과나 우승 명단을 확보한 것이 아니므로 두 목록 모두 `provenance: analyst-example`으로 지정했다.

1. 인간 보병: 프로제니터30 + 어노인티드35 + 마크드30 + 튜터25 + 인택트 2×20 + 리버레이티드35 + 니들20 + 하베스터 라이더스35 = **250점**. 기본 COM 3. 마크드에서 튜터 임플란트 선택 시 COM 2 추가. 프로제니터는 장교이자 유일한 하이 커맨드. 합류는 프로제니터→어노인티드, 튜터→마크드, 니들→첫 번째 인택트로 모두 Infantry 조건을 만족한다. 동일 대상에 두 캐릭터가 없으며 구매 유닛 9개, 합류 뒤 독립 유닛 6개다.
2. 라이즌: 네파림50 + 퍼피티어25 + 마이엘레30 + 하베스터40 + 하베스터 라이더스35 + 허스크스 3×10 + 에코스40 = **250점**. 기본 COM 8. 네파림은 장교이자 유일한 하이 커맨드. 허스크스는 AVB 3 안이며 합류는 없다. 독립 유닛 9개다.

Python 검사로 JSON 파싱, 현재 진영 ID, 모든 unitIds/sourceIds 참조, 양 목록 점수, AVB, 하이 커맨드 최대 한 명, 지휘관 장교, 합류 그룹/사본 인덱스/대상 중복, 제거 프로필 미사용을 확인했다. 본문은 한국어 음절 약 8,400자이며 원문·출처 목록을 제외한 독자용 문자열 약 12,157자다.

## 공식 입문 기사와 영상의 취급

- 공식 2026-09-04 **Quick 250-Point Army Lists for New Warcrow Players** 본문을 읽었다. Scions 두 예시와 마법·공포 입문 설명을 확인했다. 제품 묶음 중심의 초보자 제안이며 대회 결과가 아니다. 기사 Marked 35점·Harvesters 35점은 현재 로컬 검증 비용 30점·40점과 달라 구매 묶음을 현재 250점 목록으로 복사하지 않았다.
- root가 확보해 공유한 WatermelonWargames 영상 **New to Warcrow? Start Here! - What Faction to Play 2025**의 자막 중 18:01~22:53을 읽었다. 니들 소모전, 마이엘레·허스크스, 에코스 앵커를 입문 관점으로 소개하는 개인 의견만 community 절에 사용했다. 당시 표현을 현재 규칙에 우선하지 않았으며 팅지 2~7을 항상 이득으로 설명하는 부분은 채택하지 않았다. 원문 자막을 저장소에 복사하지 않았다.
- root가 공유한 Song of the Dormant 공식 설명 영상 자막은 이번 문서의 전략 근거로 사용하지 않았다. 시청·분석했다고 주장하지 않는다.

## 접근 한계와 제외한 조사

- Reddit 공개 검색 JSON은 HTTP 403이었다. 게시글이나 댓글을 읽었다고 주장하지 않으며 커뮤니티 합의·대회 메타·승률 근거로 사용하지 않았다.
- Bing RSS 질의는 HTTP 200이었지만 관련성 낮은 일반 검색 결과가 주로 나왔다. 검색 제목이나 짧은 설명을 전략 근거로 사용하지 않았다.
- 시도한 /en/factions/scions-of-yaldabaoth 및 /en/news/harvester-riders 주소는 404였고 읽은 출처로 기재하지 않았다. 실제 진영 페이지는 /en/games/warcrow/nation/scions-of-yaldabaoth에서 찾았다.
- 공식 resources 및 builder 페이지도 접근했으나 앱 셸이므로 그 HTML만으로 모든 최신 프로필을 새로 검증했다고 주장하지 않는다. 실제 카드 원본 해시와 정리된 로컬 프로필을 사용하고 11월 소속 변경을 별도로 적용했다.
- 특정 상대 유형에 대한 운영, 배치/초중후 판단, 교체안은 프로필 기반 저자 분석이다. 실제 대회에서 입증된 우열이나 객관적인 최강 조합으로 표현하지 않았다.

## 실제 사용 출처

- **Scions of Yaldabaoth: Faction Guide and Miniatures** (official)
  https://warcrow.com/en/games/warcrow/nation/scions-of-yaldabaoth
  근거: 캐릭터 보호, 마법과 도주 압박, 허스크스·인택트·마크드의 기본 방향
  범위/한계: 세계관 페이지에는 누아다와 레드 캡 항목이 남아 있으므로 현재 편성 가능 여부는 11월 3일 공지를 우선했다.
- **Warcrow Army hotfix - November 2026** (official, 2026-11-03)
  https://warcrow.com/en/news/warcrow-army-hotfix-nov26
  근거: 사이언즈에서 레드 캡 10개 프로필 제거
- **Warcrow Red Caps Update - October 2026** (official, 2026-10-22)
  https://warcrow.com/en/news/warcrow-army-update-red-caps
  근거: 레드 캡 독립 진영 신설과 11월 3일까지의 임시 중복 소속
  범위/한계: 전환 기간 공지이며 현재 합법 편성을 뜻하지 않는다.
- **Warcrow Core Rules 1.6.1** (official)
  https://experience.corvusbelli.com/en/resources/e89e441f-98af-5417-ba5d-96d9a5be719d?l=712b6686-47e5-479e-a729-80c7af9ce90a
  근거: 250점 편성·장교 지휘관·하이 커맨드 제한, 합류, 마법, 팅지 진영 표, 상태와 사기 붕괴
  범위/한계: 일반 규칙의 근거이며 각 유닛의 개별 예외는 해당 카드와 함께 적용한다.
- **Warcrow Army Builder — Scions of Yaldabaoth profiles** (official)
  https://www.warcrowarmybuilder.com/builder
  근거: 로컬 v0.13.51 검증 프로필의 비용·AVB·COM, 아이콘 확인 Join 메타데이터와 예시 편성
  범위/한계: 로컬 목록에는 이후 제거된 레드 캡이 남아 있어 공식 11월 3일 공지로 걸러 냈다. 순위·승률 자료가 아니다.
- **Quick 250-Point Army Lists for New Warcrow Players** (official, 2026-09-04)
  https://warcrow.com/en/news/250-points-lists-ideas
  근거: 공식 입문 글의 마법·공포 설명과 구매 묶음형 예시 존재 확인
  범위/한계: 대회 우승 목록이 아니다. 글의 Marked 35점·Harvesters 35점은 현재 검증 데이터의 30점·40점과 달라 그대로 복사하지 않았다.
- **New to Warcrow? Start Here! - What Faction to Play 2025** (video, 2025-12-21)
  https://www.youtube.com/watch?v=dchC5UIjcjs
  근거: WatermelonWargames 자막 18:01–22:53: 팅지 자원, 니들, 마이엘레·허스크스 연계, 에코스 입문 방향에 대한 개인 의견
  범위/한계: 구판 영상이다. 2~7 팅지를 이점으로만 표현하거나 당시 합류·레드 캡 설명을 현행 규칙으로 사용하지 않았다. 대회 성적 근거가 아니다.
- **Anointed — official unit card** (official)
  https://www.warcrowarmybuilder.com/art/card/anointed_card_en.webp
  근거: Anointed의 검증된 능력·수치·합류용 프로필
  범위/한계: 이 날짜에 내려받은 공식 이미지와 로컬 검증 원본의 SHA-256 일치를 확인했다.
- **Intact — official unit card** (official)
  https://www.warcrowarmybuilder.com/art/card/intact_card_en.webp
  근거: Intact의 검증된 능력·수치·합류용 프로필
  범위/한계: 이 날짜에 내려받은 공식 이미지와 로컬 검증 원본의 SHA-256 일치를 확인했다.
- **Marked — official unit card** (official)
  https://www.warcrowarmybuilder.com/art/card/marked_card_en.webp
  근거: Marked의 검증된 능력·수치·합류용 프로필
  범위/한계: 이 날짜에 내려받은 공식 이미지와 로컬 검증 원본의 SHA-256 일치를 확인했다.
- **Progenitor Sculptor — official unit card** (official)
  https://www.warcrowarmybuilder.com/art/card/progenitor_sculptor_card_en.webp
  근거: Progenitor Sculptor의 검증된 능력·수치·합류용 프로필
  범위/한계: 이 날짜에 내려받은 공식 이미지와 로컬 검증 원본의 SHA-256 일치를 확인했다.
- **Tutor — official unit card** (official)
  https://www.warcrowarmybuilder.com/art/card/tutor_card_en.webp
  근거: Tutor의 검증된 능력·수치·합류용 프로필
  범위/한계: 이 날짜에 내려받은 공식 이미지와 로컬 검증 원본의 SHA-256 일치를 확인했다.
- **Needle — official unit card** (official)
  https://www.warcrowarmybuilder.com/art/card/needle_card_en.webp
  근거: Needle의 검증된 능력·수치·합류용 프로필
  범위/한계: 이 날짜에 내려받은 공식 이미지와 로컬 검증 원본의 SHA-256 일치를 확인했다.
- **Liberated — official unit card** (official)
  https://www.warcrowarmybuilder.com/art/card/liberated_card_en.webp
  근거: Liberated의 검증된 능력·수치·합류용 프로필
  범위/한계: 이 날짜에 내려받은 공식 이미지와 로컬 검증 원본의 SHA-256 일치를 확인했다.
- **Harvester Riders — official unit card** (official)
  https://www.warcrowarmybuilder.com/art/card/harvester_riders_card_en.webp
  근거: Harvester Riders의 검증된 능력·수치·합류용 프로필
  범위/한계: 이 날짜에 내려받은 공식 이미지와 로컬 검증 원본의 SHA-256 일치를 확인했다.
- **Master Nepharim — official unit card** (official)
  https://www.warcrowarmybuilder.com/art/card/master_nepharim_card_en.webp
  근거: Master Nepharim의 검증된 능력·수치·합류용 프로필
  범위/한계: 이 날짜에 내려받은 공식 이미지와 로컬 검증 원본의 SHA-256 일치를 확인했다.
- **Master Maiele — official unit card** (official)
  https://www.warcrowarmybuilder.com/art/card/master_maiele_card_en.webp
  근거: Master Maiele의 검증된 능력·수치·합류용 프로필
  범위/한계: 이 날짜에 내려받은 공식 이미지와 로컬 검증 원본의 SHA-256 일치를 확인했다.
- **Puppeteer — official unit card** (official)
  https://www.warcrowarmybuilder.com/art/card/puppeteer_card_en.webp
  근거: Puppeteer의 검증된 능력·수치·합류용 프로필
  범위/한계: 이 날짜에 내려받은 공식 이미지와 로컬 검증 원본의 SHA-256 일치를 확인했다.
- **Harvester — official unit card** (official)
  https://www.warcrowarmybuilder.com/art/card/harvester_card_en.webp
  근거: Harvester의 검증된 능력·수치·합류용 프로필
  범위/한계: 이 날짜에 내려받은 공식 이미지와 로컬 검증 원본의 SHA-256 일치를 확인했다.
- **Husks — official unit card** (official)
  https://www.warcrowarmybuilder.com/art/card/husks_card_en.webp
  근거: Husks의 검증된 능력·수치·합류용 프로필
  범위/한계: 이 날짜에 내려받은 공식 이미지와 로컬 검증 원본의 SHA-256 일치를 확인했다.
- **Echoes — official unit card** (official)
  https://www.warcrowarmybuilder.com/art/card/echoes_card_en.webp
  근거: Echoes의 검증된 능력·수치·합류용 프로필
  범위/한계: 이 날짜에 내려받은 공식 이미지와 로컬 검증 원본의 SHA-256 일치를 확인했다.
