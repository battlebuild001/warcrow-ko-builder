# 워크로우 한글 아미 빌더 초안

6개 진영의 177개 유닛 레코드를 사용하는 정적 웹 앱이다. 일반전과 WTS 시즌 2 편성, 250점 기준 점수 상한, AVB, High Command, 용병 최대 1개 및 시즌 2 출전 불가 유닛을 검사한다.

`dist/`가 배포 파일이다. `app-data.json`은 `/workspace/warcrow-research`의 수집 자료에서 생성했다. 정식 서비스 전에는 Officer/Support 구분과 유닛 프로필을 CorvuSphere 최신 자료와 대조해야 한다.

`card-ko.json`은 162종의 한국어 유닛 이름과 확보한 카드 이미지 158종의 한국어 텍스트 초안을 담는다. 카드 텍스트는 OCR 및 자동 번역을 거쳤으므로 주사위 기호, 상태 효과, 수치의 원본 대조가 필요하다. 원본 카드 이미지가 제공되지 않는 4종은 편성 메타데이터만 한국어로 표시한다.

원본 카드 이미지가 있는 158종의 `카드 보기`는 카드 전체 이미지를 바탕으로 쓰므로 카드마다 다른 포인트 리본, 인물, 주사위, 전투 기호, 강화 패널, 능력 상자의 모양과 위치가 그대로 표시된다. 원본의 이름, 특성, 455개 능력 상자, 469개 전투 효과 상자 좌표에는 한국어 번역 초안을 겹쳐 표시한다. 작은 문구는 카드 아래 `한국어 능력과 전투 효과 크게 보기`에서 읽을 수 있다. OCR·자동 번역 결과는 검토용이며 수치와 규칙 용어는 하단 영문 원본과 대조해야 한다.

기호의 정확한 모양은 158종 원본 카드 이미지 안의 도식을 사용한다. `dist/icons.svg`의 벡터 기호는 원본 카드가 없는 경우의 대체 화면에 쓰인다. 원본 카드 이미지가 제공되지 않는 4종(`amaury_boissonade`, `ismail_the_eighth_pillar`, `ludivine_corbin`, `neakail_oen_fhiahra`)은 편성 메타데이터와 확보된 번역만 표시한다. 뒤의 두 캐릭터는 공식 사이트에 인물 초상만 있고 전체 카드 이미지는 없다.

`dist/card-profiles.json`은 카드별 기본 능력치, 전투 주사위와 강화 패널 경계·보너스 자료다. `dist/card-abilities.json`과 `dist/card-effects.json`은 원본의 능력·전투 효과 상자별 좌표, OCR 및 한국어 번역 초안이다. 생성 과정은 `/workspace/warcrow-research/extract_card_profiles.py`, `extract_enhancement_stats.py`, `extract_ability_boxes.py`, `translate_ability_boxes.py`, `extract_effect_boxes.py`, `translate_effect_boxes.py`에 있다. 공식 규칙용으로 확정하려면 각 카드의 모든 문구를 추가 대조해야 한다.

색상 테마는 프로젝트의 워크로우 지침을 따른다: 배경 `#16131C`, 표면 `#241F2E`, 주 강조 `#B6A0DE`, 보조 강조 `#94B9AC`. `dist/style.css`의 공통 변수에서 파생 색을 관리한다. 주사위의 빨강·노랑·주황·초록·파랑은 게임 정보이므로 색상 의미를 유지한다.

로컬에서 보려면 `python -m http.server 8000 -d dist`를 실행한다.
