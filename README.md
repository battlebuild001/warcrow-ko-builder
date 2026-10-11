# 워크로우 한글 아미 빌더 초안

6개 진영의 177개 유닛 레코드를 사용하는 정적 웹 앱이다. 일반전과 WTS 시즌 2 편성, 250점 기준 점수 상한, AVB, High Command, 용병 최대 1개 및 시즌 2 출전 불가 유닛을 검사한다.

`dist/`가 배포 파일이다. `app-data.json`은 `/workspace/warcrow-research`의 수집 자료에서 생성했다. 정식 서비스 전에는 Officer/Support 구분과 유닛 프로필을 CorvuSphere 최신 자료와 대조해야 한다.

로컬에서 보려면 `python -m http.server 8000 -d dist`를 실행한다.
