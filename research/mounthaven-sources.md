# 마운트헤이븐 전략 가이드 조사 기록

- 조사일: 2026-11-16 (UTC).
- 산출물: `dist/strategy-factions/mounthaven.json`.
- 본문 약 8,752개 한글 음절(출처 목록 제외); 공식 사실·저자 분석·커뮤니티 영상 확인을 sections.kind로 구분했다.
- 브라우저/서버/유료 영상 도구/하위 에이전트는 사용하지 않았다. 네트워크는 urllib.request로 직접 읽었다.

## 실제 확인한 공식 웹 문서

1. 공식 팩션 페이지 `https://warcrow.com/en/games/warcrow/nation/mounthaven`: HTTP200, 본문 직접 읽음. 밀리샤 기본축, 헤드헌터·봄바디어 압박, 중앙의 캐릭터 보병, 폴더 강화와 점령 유지라는 설명을 확인했다. 사이트의 비스티드 라이더스/타이탄 소개를 로컬 빌더에 없는 프로필의 수치로 확대하지 않았다.
2. `https://warcrow.com/en/news/mounthaven-preorder`: HTTP200, 2026-03-03 본문 직접 읽음. 액션팩의 올가1·키퍼1·밀리샤4모델(유닛1)·폴더1·흐로드레이크스1·레이더스2모델(유닛1) 구성 확인. 현 로컬 비용 합은155점.
3. `https://warcrow.com/en/news/250-points-lists-ideas`: HTTP200, 2026-09-04 본문 직접 읽음. 공식 입문 구매 예시는 확인했지만 기사상 밀리샤20점/앤빌45점은 현재 로컬25점/25점과 불일치한다. 본문의 예시를 현재 검증된 대회 목록이라 부르지 않았고, 예시 두 개는 별도 저자 연습 목록으로 산출했다.
4. `https://warcrow.com/en/news/rules-update-1-6`: HTTP200, 2026-04-21 본문 직접 읽음. 스킬 구분, 지원 캐릭터의 병력 계산, 합류/이탈 토큰, 키워드 중복, 이동 효과 개정 등의 버전 차이를 확인했다. 세부 판정은 이 기사 대신1.6.1 원문을 사용했다.
5. `https://warcrow.com/en/news/warcrow-army-hotfix-nov26`: HTTP200, 2026-11-03 본문 직접 읽음. 레드 캡 분리·군너리 코퍼럴 문구·WTS 프랑스어 변경이며 마운트헤이븐의 새 수치 근거로 사용하지 않았다.
6. `https://warcrow.com/en/blog`는 `/en/news`로 이동한다. `/sitemap.xml`과 뉴스2~7페이지를 읽어 팩션·출시 기사 URL을 찾았다. 단순 사이트 목록은 전략 근거로 쓰지 않았다.

## 공식 룰북 및 카드 대조

- 사용자 제공 `/tmp/warcrow-official-rules.pdf`와 기존 전문 전사/한국어 번역 데이터 사용. 인쇄25~27쪽 편성·지휘 토큰,38~40쪽 활성화,55~59쪽 스킬,69~73쪽 상태·회복,73~81쪽 캐릭터,84~92쪽 키워드/이동 효과를 대조했다.
- `mh-core`의 공개 resource URL은 직접 요청하여 HTTP200으로 `warcrow-rules-1-6-1-eng.pdf`에 연결됨을 확인했다. 임시 서명된 리다이렉트 URL은 출처에 복사하지 않고 안정적인 resource URL만 보존했다.
- 유닛의 비용·AVB·진영·COM은 `app-data.json` v0.13.51, 공식 보유 키워드/장교·지원/Join은 `join-metadata.json`, 실제 능력은 `card-abilities.json`, 실제 스위치는 `card-effects.json`, 능력치/행/병력수는 `native-cards.json` 기준이다. 고유명 음차는 `card-ko.json.names` 사용.
- app-data의 깨진 `Join (Dwarf`/`Infantry)` 조각을 그대로 읽지 않고, join-metadata의 정확한 AND 그룹을 사용했다. specialRules 참조어를 보유 키워드로 바꾸지 않았다.
- 공식 카드 URL은 아래 개별 source 행의 모든 카드에 대해 HTTP HEAD200/image/webp를 확인했다. 내용은 기존 공식 이미지 검증 전사자료를 읽었다. HEAD 응답만으로 새 카드 내용을 해석했다고 주장하지 않는다.

### 운영에서 중요하게 구분한 사실

- COM은 모집한 유닛의 합으로 게임 시작에 마련하며, 사용 후 별도 효과 없이는 회복하지 않는다. 라운드당 충전으로 설명하지 않았다.
- 올가의 배틀 본즈는 합류 프로필의 지휘 능력이며 라운드당1회·활성화 종료·선행 공격/돌격/강습·다른 아군12보폭·토큰1 조건을 유지했다.
- 흐로드레이크스의 가이드 데스티니는 일반 프로필에만 있다. 앤빌의 주변 오라 역시 일반 프로필이다. 독립 운용 이유를 공격 주사위 증가와 별도로 설명했다.
- 해머의 커리지는 공격/방어 시 첫 전투 행 사용이다. 점령값이나 실제 병력 복구로 확대하지 않았다. 해머·올가의 개인 정예가 합류 부대에 자동 공유된다고 쓰지 않았다.
- 폴더의 강화는 독립0점 유닛이 아니다. 강화 시전과 강화 대상에게 행동을 전달하는 전투 능력을 구분했다. 디 아울은 배치 능력 행동, 더 베어는 전투 해결 후 밀어내기/추격 변화다.
- 키퍼는 독립 시 광역 회복 행동과 합류 시 병력 회복 지휘 능력이 서로 다르다. 한 유닛에 키퍼와 워 오거를 동시에 붙이지 않았다.
- 레이더스의 무료 프로펄전 부츠는 게임 시작 후 정찰 배치 시점이며 일반 배치와 혼동하지 않았다. 감소 행의 점령0도 별도 주의했다.
- 봄바디어의 대상 병력별 주황 주사위 추가에는 같은 색 최대3개 제한을 적용했고, 광역 피해가 모든 유닛에 적용됨을 명시했다.

## 커뮤니티/영상 접근 결과

- Goonhammer 검색 URL `https://www.goonhammer.com/?s=warcrow+mounthaven`는403. 원문을 확인했다고 쓰지 않았다.
- Reddit `https://www.reddit.com/r/WarCrow/search/?q=mounthaven&restrict_sr=1`도403. 원문 댓글·승률·대회 의견은 인용하지 않았다. 우회 접근은 시도하지 않았다.
- Bing RSS의 Warcrow/Mounthaven 검색은 일반 홈페이지 또는 무관한 결과를 반환해 독립적인 현행 전술 기사 근거를 확보하지 못했다. 검색 결과 제목을 읽은 기사로 처리하지 않았다.
- root가 제공한 `/tmp/warcrow-strategy-dchC5UIjcjs.json` 실제 자막을 읽음. Watermelon Wargames, 「New to Warcrow? Start Here! - What Faction to Play 2025」(2025-12-21), `https://www.youtube.com/watch?v=dchC5UIjcjs`.40:58~41:15에2026년3월 출시 예정이며 구체 유닛을 아직 모른다고 말한다. 따라서 현재 마운트헤이븐 전술의 근거로 쓰지 않고 발행 시점 주의 항목으로만 구분했다. 자막 원문을 저장소에 복제하지 않았다.
- 실제 읽어 검증한 마운트헤이븐 우승 대회 명단/승률 자료는 없다. 가이드의 상대 대응·연계·명단은 analyst-example이며 메타 최강/우승 목록이라고 주장하지 않았다.

## 로스터 검증 결과

`/tmp/validate-mh-strategy.cjs`에서 실제 joins.js의 validateJoins를 사용해 검증했다. 브라우저나 서버 실행 없이 Node VM의 순수 데이터 검증만 수행했다.

### 올가의 중앙과 측면 — 250/250점

| 유닛 | 개수 | 단가 | 합계 |
|---|---:|---:|---:|
| Olga Princess of Mounthaven | 1 | 40 | 40 |
| Keeper of the Sacred Fire | 1 | 20 | 20 |
| Mounthaven Militia | 1 | 25 | 25 |
| Folder | 1 | 20 | 20 |
| Hrodreiks Thirteenth Executor of the Master Plan | 1 | 25 | 25 |
| Raiders | 1 | 25 | 25 |
| Hearthguard | 1 | 35 | 35 |
| Mounthaven Warriors | 1 | 30 | 30 |
| Unrelenting | 1 | 30 | 30 |

- 총250점, 최고 지휘부1명, 확인된 장교 지휘관, 전 개체 AVB 이내, 진영 일치.
- COM4, 선택 유닛9개, 합류2건, 합류 후 독립 편대7개.
- 한 유닛당 캐릭터1명, 모든 Join(Dwarf, Infantry) 조건 확인.
- 지휘관: `olga-princess-of-mounthaven`.
- 합류: [{"characterId": "olga-princess-of-mounthaven", "characterCopy": 0, "targetId": "hearthguard", "targetCopy": 0}, {"characterId": "keeper-of-the-sacred-fire", "characterCopy": 0, "targetId": "mounthaven-militia", "targetCopy": 0}].

### 해머의 유지력과 예약 반격 — 250/250점

| 유닛 | 개수 | 단가 | 합계 |
|---|---:|---:|---:|
| Hammer | 1 | 40 | 40 |
| Anvil | 1 | 25 | 25 |
| War Augur | 1 | 25 | 25 |
| Mounthaven Militia | 1 | 25 | 25 |
| Hearthguard | 1 | 35 | 35 |
| Mounthaven Warriors | 1 | 30 | 30 |
| Unrelenting | 1 | 30 | 30 |
| Folder | 1 | 20 | 20 |
| Bombardier | 1 | 20 | 20 |

- 총250점, 최고 지휘부1명, 확인된 장교 지휘관, 전 개체 AVB 이내, 진영 일치.
- COM4, 선택 유닛9개, 합류2건, 합류 후 독립 편대7개.
- 한 유닛당 캐릭터1명, 모든 Join(Dwarf, Infantry) 조건 확인.
- 지휘관: `hammer`.
- 합류: [{"characterId": "hammer", "characterCopy": 0, "targetId": "mounthaven-warriors", "targetCopy": 0}, {"characterId": "war-augur", "characterCopy": 0, "targetId": "hearthguard", "targetCopy": 0}].

## 산출물 출처 ID 대응

| ID | 문서 | URL |
|---|---|---|
| mh-nation | Mounthaven: Faction Guide and Miniatures | https://warcrow.com/en/games/warcrow/nation/mounthaven |
| mh-release | Mounthaven is finally here! | https://warcrow.com/en/news/mounthaven-preorder |
| mh-starter | Quick 250-Point Army Lists for New Warcrow Players | https://warcrow.com/en/news/250-points-lists-ideas |
| mh-core | Warcrow Core Rules 1.6.1 — 사용자 제공 공식 영문 룰북 | https://experience.corvusbelli.com/en/resources/e89e441f-98af-5417-ba5d-96d9a5be719d?l=712b6686-47e5-479e-a729-80c7af9ce90a |
| mh-update | Rules update 1.6 | https://warcrow.com/en/news/rules-update-1-6 |
| mh-card-mounthaven-militia | Mounthaven Militia — official unit card | https://www.warcrowarmybuilder.com/art/card/mounthaven_militia_card_en.webp |
| mh-card-mounthaven-warriors | Mounthaven Warriors — official unit card | https://www.warcrowarmybuilder.com/art/card/mounthaven_warriors_card_en.webp |
| mh-card-hearthguard | Hearthguard — official unit card | https://www.warcrowarmybuilder.com/art/card/hearthguard_card_en.webp |
| mh-card-raiders | Raiders — official unit card | https://www.warcrowarmybuilder.com/art/card/raiders_card_en.webp |
| mh-card-hammer | Hammer — official unit card | https://www.warcrowarmybuilder.com/art/card/hammer_card_en.webp |
| mh-card-olga-princess-of-mounthaven | Olga Princess of Mounthaven — official unit card | https://www.warcrowarmybuilder.com/art/card/olga_princess_of_mounthaven_card_en.webp |
| mh-card-hrodreiks-thirteenth-executor-of-the-master-plan | Hrodreiks Thirteenth Executor of the Master Plan — official unit card | https://www.warcrowarmybuilder.com/art/card/hrodreiks_thirteenth_executor_of_the_master_plan_card_en.webp |
| mh-card-folder | Folder — official unit card | https://www.warcrowarmybuilder.com/art/card/folder_card_en.webp |
| mh-card-anvil | Anvil — official unit card | https://www.warcrowarmybuilder.com/art/card/anvil_card_en.webp |
| mh-card-keeper-of-the-sacred-fire | Keeper of the Sacred Fire — official unit card | https://www.warcrowarmybuilder.com/art/card/keeper_of_the_sacred_fire_card_en.webp |
| mh-card-headhunter | Headhunter — official unit card | https://www.warcrowarmybuilder.com/art/card/headhunter_card_en.webp |
| mh-card-bombardier | Bombardier — official unit card | https://www.warcrowarmybuilder.com/art/card/bombardier_card_en.webp |
| mh-card-war-augur | War Augur — official unit card | https://www.warcrowarmybuilder.com/art/card/war_augur_card_en.webp |
| mh-card-ancestor | Ancestor — official unit card | https://www.warcrowarmybuilder.com/art/card/ancestor_card_en.webp |
| mh-card-mounthaven-veteran | Mounthaven Veteran — official unit card | https://www.warcrowarmybuilder.com/art/card/mounthaven_veteran_card_en.webp |
| mh-card-unrelenting | Unrelenting — official unit card | https://www.warcrowarmybuilder.com/art/card/unrelenting_card_en.webp |
| mh-card-biwa | Biwa — official unit card | https://www.warcrowarmybuilder.com/art/card/biwa_card_en.webp |
| mh-card-the-bear | The Bear — official unit card | https://www.warcrowarmybuilder.com/art/card/the_bear_card_en.webp |
| mh-card-the-owl | The Owl — official unit card | https://www.warcrowarmybuilder.com/art/card/the_owl_card_en.webp |
| mh-card-waljan-the-last-of-the-first | Waljan, the Last of the First — official unit card | https://www.warcrowarmybuilder.com/art/card/waljan_the_last_of_the_first_card_en.webp |
| mh-card-zsoka | Zsoka — official unit card | https://www.warcrowarmybuilder.com/art/card/zsoka_card_en.webp |
| mh-video-start | New to Warcrow? Start Here! - What Faction to Play 2025 — Watermelon Wargames | https://www.youtube.com/watch?v=dchC5UIjcjs |

모든 section/unitRoles/synergies/rosters의 sourceIds가 sources에 존재하고 모든 unitIds가 마운트헤이븐 유닛 데이터에 있는지 확인했다.
