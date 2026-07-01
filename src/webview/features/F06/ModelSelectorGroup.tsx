import type { ChangeEvent, FC } from 'react';
import { useTranslation } from 'react-i18next';

interface ModelSelectorGroupProps {
  summaryModel: string | null;
  qaModel: string | null;
  models: readonly string[];
  onChangeSummaryModel: (model: string) => void;
  onChangeQAModel: (model: string) => void;
}

export const ModelSelectorGroup: FC<ModelSelectorGroupProps> = ({
  summaryModel,
  qaModel,
  models,
  onChangeSummaryModel,
  onChangeQAModel,
}) => {
  const { t } = useTranslation();

  return (
    <div className="grid gap-2 border-t border-line px-3 pb-3">
      <label className="grid gap-1.5 pt-2 text-[11.5px] text-muted">
        <span>{t('settings.summary_model_label')}</span>
        <select
          className="w-full rounded-sm border border-line bg-elevated px-2.5 py-2 text-text"
          value={summaryModel ?? models[0] ?? ''}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onChangeSummaryModel(event.target.value)}
        >
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-[11.5px] text-muted">
        <span>{t('settings.qa_model_label')}</span>
        <select
          className="w-full rounded-sm border border-line bg-elevated px-2.5 py-2 text-text"
          value={qaModel ?? models[0] ?? ''}
          onChange={(event: ChangeEvent<HTMLSelectElement>) => onChangeQAModel(event.target.value)}
        >
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};
