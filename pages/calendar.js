import Layout from '../components/Layout';
import { useI18n } from '../lib/i18n';

export default function Calendar() {
  const { t } = useI18n();
  return (
    <Layout>
      <h1 className="text-2xl font-bold">{t('calendar')}</h1>
      <p className="text-gray-600 mt-2">{t('calendar_intro')}</p>
    </Layout>
  );
}
