# 퓨덤 전략 가이드 조사 기록

- 작성일: 2026-11-16
- 결과: `dist/strategy-factions/feudom.json`
- 기준: 공식 빌더 수집본 v0.13.51, 원문 카드 검증 데이터, Core Rules 1.6.1.
- 본문은 규칙의 사실, 프로필 기반 저자 분석, 커뮤니티 영상 의견을 `sections.kind`로 구별했다. 두 250점 로스터는 `analyst-example`이며 실제 대회 입상 리스트가 아니다.
- 원문 페이지·유튜브 자막은 배포 데이터로 복제하지 않았다. 결과 파일에는 직접 작성한 한국어 설명과 출처 메타데이터만 포함했다.

## 실제 읽은 공식 웹 문서

1. **Feudom** — Jesús 'V' Fuster / Silvia Pato·Rodrigo García Carmona, 2022-09-22.
   - https://warcrow.com/en/news/feudom
   - HTTP 200, 본문 전체 읽음.
   - 기사와 프리스티스의 협력, 기사단 및 두 달의 여신을 섬기는 배경. 배경 설명을 전투 보너스나 현행 승률로 사용하지 않음.
2. **Quick 250-Point Army Lists for New Warcrow Players** — Cora Diz, 2026-09-04.
   - https://warcrow.com/en/news/250-points-lists-ideas
   - HTTP 200, 본문 전체 읽음.
   - 퓨덤의 공식 입문 구매 묶음은 230점과 235점. 각각 The Song of the Dormant + Beyond the Song of the Dormant를 바탕으로 Officers 또는 Knights/Foot Knights를 추가함.
   - 구매 박스 조합이며 우승 리스트가 아님. 본 가이드의 별도 250점 유닛 편성으로 오인시키지 않음.
3. **Roland Loussier and Whitetrail** — Carlos 'Koni' Morales, 2026-10-09.
   - https://warcrow.com/en/news/roland-loussier
   - HTTP 200, 본문 전체 읽음.
   - 공식 설명의 이동 4-2, W 5, 우선 표적 고립·기동 역할을 확인. 홍보 문구의 “anywhere / any unit”를 사거리·조건 없는 실제 규칙으로 사용하지 않음.
4. **WTS Season 2: The hungry tide** — Pep “Neengash” Mañas, 2026-09-01.
   - https://warcrow.com/en/news/wts-season-2
   - HTTP 200, 본문 전체 읽음.
   - 퓨덤의 Roland/Mist Guard 추가, 공용 Starvingson, Core 1.6.1 도입 확인. WTS2의 군사·비전 점수 변화는 공통 가이드 담당 영역이므로 퓨덤 문서에서 과도하게 확장하지 않음.
5. **Rules update 1.6** — Hoopoe, 2026-04-21.
   - https://warcrow.com/en/news/rules-update-1-6
   - HTTP 200, 본문 전체 읽음.
   - 모르간/아처스/에스코트 등 사거리·효과 개정 이력이 있으므로 구영상의 수치를 그대로 복사하면 안 된다는 교차 검증에 사용. 현행 사실은 1.6.1과 카드 우선.
6. **Warcrow Army hotfix - November 2026**, 2026-11-03.
   - https://warcrow.com/en/news/warcrow-army-hotfix-nov26
   - HTTP 200, 본문 전체 읽음. 이 공지에서 퓨덤 직접 변경은 확인되지 않음. 따라서 이것만으로 모든 퓨덤 카드가 완전히 최신임을 주장하지 않음.
7. **Warcrow's Mounted Units**, 2026-06-30.
   - https://warcrow.com/en/news/mounted-units
   - HTTP 200, 본문 전체 읽음. 피에르 베송의 배경 확인에 그쳐 핵심 전술 근거로 쓰지 않음.
8. **The Warcrow Universe**
   - https://warcrow.com/en/universe
   - HTTP 200, 세계관·진영 탐색. 전술 근거에는 사용하지 않음.

## 공식 빌더·룰북·카드

- https://www.warcrowarmybuilder.com/builder — HTTP 200.
- https://experience.corvusbelli.com/en/warcrow/resources — HTTP 200.
- 룰북은 사용자 제공 PDF `/tmp/warcrow-official-rules.pdf`와 전문 번역을 대조함. 편성 25–26쪽, 지휘·행동·돌격·스위치·스트레스, 합류 73–81쪽, 목표물 통제 101–103쪽이 주요 근거다.
- 데이터는 `app-data.json`, `native-cards.json`, `card-abilities.json`, `card-effects.json`, `join-metadata.json`, `card-ko.json`을 함께 사용했다. raw specialRules를 보유 키워드로 잘못 사용하지 않았다.
- 원문 카드 다음 URL 모두 GET HTTP 200 확인. 원문 이미지로 이미 검증된 프로젝트 수치·문구를 기준으로 전략을 작성했다.
  - https://www.warcrowarmybuilder.com/art/card/magister_card_en.webp
  - https://www.warcrowarmybuilder.com/art/card/feudom_guisarmiers_card_en.webp
  - https://www.warcrowarmybuilder.com/art/card/feudom_archers_card_en.webp
  - https://www.warcrowarmybuilder.com/art/card/feudom_foot_knights_card_en.webp
  - https://www.warcrowarmybuilder.com/art/card/feudom_knights_card_en.webp
  - https://www.warcrowarmybuilder.com/art/card/pierre_besson_grand_magister_card_en.webp
  - https://www.warcrowarmybuilder.com/art/card/commander_card_en.webp
  - https://www.warcrowarmybuilder.com/art/card/morgane_de_jauffret_card_en.webp
  - https://www.warcrowarmybuilder.com/art/card/armelle_of_northsby_card_en.webp
  - https://www.warcrowarmybuilder.com/art/card/royal_falconer_card_en.webp

### 조합 검토에서 특별히 확인한 규칙

- 합류는 캐릭터 한 명만 가능. 쉼표는 AND, 세로줄은 OR이며 피에르→퓨덤 나이츠는 기사+기병 조건을 만족한다.
- 합류하면 독립 능력을 모두 유지하는 것이 아니다. 모르간의 Gaze/Blessed Brooch와 커맨더의 Right Hand는 독립 프로필에 있으므로 예시에서 독립 운용한다.
- 마지스터의 To Arms는 배치 시 최대 네 추가 COM. 정찰을 보류한 유닛은 실제 배치 시점까지 그 토큰 획득이 늦어진다.
- 마지스터의 Noble Lineage로 귀족을 얻은 유닛은 Follow Suit 대상 조건에서 빠진다. 예시는 원래 귀족인 풋 나이츠에 합류시킨다.
- 귀자르미에 점령은 완편 2, 약화 1이고, 귀족 7보폭이면 +1. 귀족 캐릭터의 특성은 합류만으로 자동 공유되지 않는다.
- 기병의 일반 돌격은 13, 피에르 합류 유닛은 15. 선택 재굴림 전역 지원과 합류 프로필 보너스는 별개다.
- 아처스 반응 공격은 사거리·시야선을 무시하나 스위치를 사용할 수 없고 스트레스 1 비용이 있다. MOR 1의 상한을 고려했다.
- Royal Falconer, Armelle, Mist Guard 등의 점령 0을 목표물 담당으로 세지 않았다.

## 실제 자막을 읽은 영상

**Watermelon Wargames — I Accidentally Made the Most Popular Feudom List? | Bunker Verena | Warcrow: Feudom 101**, 2026-01-12.

- https://www.youtube.com/watch?v=WW3iAYS5o5M
- root가 확보한 `/tmp/warcrow-strategy-WW3iAYS5o5M.json`의 0:02–18:23 자막 전체를 읽었다. 유료 영상 도구를 별도로 호출하지 않았다.
- 2:09–4:17: 베레나·메이스 에스코트·독립 커맨더의 보호/휴식 지원과 나머지 병력의 목표물 분업.
- 6:25–7:17: 세리모니얼 스태프의 지휘 토큰 비용, 여러 피해 발생에 대한 소모, WP 실패 가능성.
- 15:07–16:45: 집중된 전력, 약한 측면, 복귀 WP 실패와 핵심 유닛 의존성.
- 구버전 주의: 영상의 에스코트 5보폭은 현재 검증 카드에서 7보폭. 고정 총 활성화 수·당시 임무·아마우리 콤보는 현행 규칙으로 복사하지 않음.
- 제작자의 인기·메타·승리 경험을 전체 커뮤니티의 검증된 승률이나 우승 성적으로 주장하지 않음.
- 원래 영상의 전체 로스터를 이 가이드의 250점 예시라고 표시하지 않음. 소스 자막을 repo/dist에 복사하지 않음.

## 접근 실패와 조사 한계

- Reddit `https://www.reddit.com/r/WarCrow/search.json?q=Feudom&restrict_sr=on`: HTTP 403. 우회하지 않았으며 Reddit 원문을 읽었다고 주장하거나 의견을 인용하지 않았다.
- Bing RSS 검색은 HTTP 200이었지만 검색어와 무관한 결과가 반복되어, 제목·검색 요약만으로 전술 근거를 만들지 않았다.
- 추정한 `/en/factions/feudom`, `/en/nations/feudom` 경로는 404. 공식 뉴스의 실제 Feudom 문서를 찾아 본문을 읽었다.
- 현행 검증 가능한 대회 입상 로스터·승률 자료는 확보하지 못했다. 아래 두 편성은 학습 목적의 작성자 제안이다.
- 초안 작성 시 아마우리 보이소나드, 이스마일, 디 에이트 필러, 루디빈 코빈의 상세 원문 카드가 미수집이었다. 2026-11-16 후속 감사에서 공식 영문 WebP를 직접 확인해 네이티브 카드 데이터를 복원했다. 예시 로스터는 기존 구성을 유지한다.
- 26개 퓨덤 프로필 중 원문 검증 자료가 있는 23개는 역할별 설명에 포함했고, 나머지 세 개의 한계를 본문에 적었다.

## 실행한 검증

JSON parse, 모든 unitIds의 퓨덤 소속, 모든 sourceIds의 sources 존재를 검사했다. `dist/joins.js`의 실제 `validateJoins`를 Node VM에서 불러와 합류 조건도 검사했다.

1. 마지스터 연습안
   - 250/250점, 기본 COM 2, HC는 마지스터 한 명이며 공식 확인 장교.
   - 9개 편성 개체, 마지스터→풋 나이츠 1개 합류 후 독립 유닛 묶음 8개.
   - 귀자르미에 2/AVB 3, 그 외 1개씩/각 AVB 이내.
   - To Arms 추가 COM은 기본 COM에 미리 합산하지 않음.
2. 피에르 연습안
   - 250/250점, 기본 COM 3, HC는 피에르 한 명이며 공식 확인 장교.
   - 9개 편성 개체, 피에르→첫 번째 퓨덤 나이츠 합류 후 독립 유닛 묶음 8개.
   - 퓨덤 나이츠 2/AVB 2, 그 외 1개씩/각 AVB 이내.
   - 커맨더는 독립 운용. 합류 후 Right Hand를 사용할 수 있다고 설명하지 않음.

두 예시 모두 진영·AVB·250점 한도·장교 지휘관·HC 한 명·합류 조건 검증을 통과했다. 브라우저/서버 실행과 다른 공유 파일 수정은 수행하지 않았다.
