import "../styles/globals.css";
import {NextIntlProvider} from "next-intl";
import {getMessages, defaultLocale} from "../lib/i18n";
import Navbar from "../shared/Navbar";

export default function App({Component, pageProps, router}) {
  const {messages, locale} = pageProps;
  return (
    <NextIntlProvider messages={messages} locale={locale || defaultLocale}>
      <div className="navbar"><Navbar/></div>
      <Component {...pageProps} />
      <div className="footer container">© {new Date().getFullYear()} LifesavingRankings</div>
    </NextIntlProvider>
  );
}

App.getInitialProps = async ({Component, ctx}) => {
  const locale = ctx?.query?.lang || defaultLocale;
  const messages = await getMessages(locale);
  let pageProps = { locale, messages };
  if (Component.getInitialProps) {
    const extra = await Component.getInitialProps(ctx);
    pageProps = {...pageProps, ...extra};
  }
  return {pageProps};
};
