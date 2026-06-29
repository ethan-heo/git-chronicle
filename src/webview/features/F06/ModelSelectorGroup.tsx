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
    <div className="model-selector-group">
      <label className="model-selector-field">
        <span>{t('settings.summary_model_label')}</span>
        <select value={summaryModel ?? models[0] ?? ''} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChangeSummaryModel(event.target.value)}>
          {models.map((model) => (
            <option key={model} value={model}>
              {model}
            </option>
          ))}
        </select>
      </label>
      <label className="model-selector-field">
        <span>{t('settings.qa_model_label')}</span>
        <select value={qaModel ?? models[0] ?? ''} onChange={(event: ChangeEvent<HTMLSelectElement>) => onChangeQAModel(event.target.value)}>
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
