import Layout from '../components/Layout';
import { useI18n } from '../lib/i18n';

export default function Competitions() {
  const { t } = useI18n();
  return (
    <Layout>
      <h1 className="text-2xl font-bold">{t('competitions')}</h1>
      <p className="text-gray-600 mt-2">{t('competitions_intro')}</p>
    </Layout>
  );
}
