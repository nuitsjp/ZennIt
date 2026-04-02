export function ensureSummaryGenerationSucceeded(response) {
  if (!response) {
    throw new Error('要約生成の結果を受信できませんでした。');
  }

  if (response.success === false) {
    throw new Error(response.error || '要約生成に失敗しました。');
  }
}

export function createSummaryFailureMessage(error) {
  return `要約生成中にエラーが発生しました: ${error.message || '不明なエラー'}`;
}
