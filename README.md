# AI Code Structure Eval

AI 에이전트가 같은 요구사항을 처리할 때, 코드 구조가 성공률과 탐색 비용에 어떤 영향을 주는지 보기 위한 작은 평가 하네스다.

1차 목표는 완전 자동화가 아니다. 먼저 `mixed`와 `separated` 두 버전의 코드를 같은 형태의 임시 워크스페이스로 복사하고, 별도 에이전트가 그 워크스페이스 하나만 보고 작업하게 만든다. 작업이 끝나면 숨겨진 테스트와 diff를 통해 결과를 채점한다.

## 구조

```text
ai-code-structure-eval/
  cases/
    company-fee/
      variants/
        mixed/
        separated/
      tasks/
        modal-count.md
      hidden-tests/
        modal-count.test.ts
  shared/
    package.json
    tests/
      companyFeeService.test.ts
  scripts/
    prepare-run.mjs
    grade-run.mjs
  results/
```

`mixed`는 계산, 조건 판단, API 호출, UI 변경이 한 함수 안에 섞인 버전이다.

`separated`는 송금 대상 계산을 `getCompanyFees`로 분리한 버전이다. 다만 두 버전 모두 같은 버그를 갖고 시작한다. 송금 완료 모달이 실제 송금 대상 수가 아니라 전체 입력 기업 수를 표시한다.

## 1차 수동 실험 흐름

먼저 실행 워크스페이스를 만든다.

```bash
npm run prepare:mixed
```

또는:

```bash
npm run prepare:separated
```

스크립트는 `/tmp/ai-code-structure-eval-runs/{runId}/workspace`를 만든다. 이 폴더에는 선택된 코드와 `task.md`만 들어간다. `mixed`, `separated`, `hidden-tests` 같은 이름은 워크스페이스 안에 남기지 않는다.

그 다음 별도 에이전트에게 해당 `workspace`만 열어준다. 예를 들면:

```text
이 저장소의 task.md 요구사항을 구현해줘.
필요하면 테스트를 추가하거나 수정해도 됩니다.
작업이 끝나면 어떤 파일을 수정했는지 알려주세요.
```

에이전트 작업이 끝나면 원본 평가 저장소에서 채점한다.

```bash
npm run grade -- --run-id {runId}
```

채점 스크립트는 다음을 수행한다.

- 숨겨진 테스트를 워크스페이스에 주입한다.
- 공개 테스트와 숨겨진 테스트를 함께 실행한다.
- baseline과 workspace의 diff를 저장한다.
- 테스트 결과와 변경량을 `results/{runId}/summary.json`에 저장한다.

## 실험 시 주의점

에이전트에게 원본 평가 저장소를 열어주면 안 된다. 원본 저장소에는 양쪽 variant와 hidden test가 모두 있기 때문이다.

에이전트의 기준 폴더는 항상 다음 형태여야 한다.

```text
/tmp/ai-code-structure-eval-runs/{runId}/workspace
```

`/tmp/ai-code-structure-eval-runs` 전체나 원본 저장소 루트를 열어주면 이전 실행 결과, 다른 variant, 숨겨진 테스트가 힌트가 될 수 있다.

## 현재 수집하는 지표

- 공개 테스트/숨겨진 테스트 통과 여부
- 실행 시간
- 변경 파일 수
- diff 추가/삭제 라인 수
- 테스트 출력
- diff patch

토큰 사용량은 2차에서 에이전트별 CLI/API 로그 수집 방식이 정해진 뒤 붙인다.
