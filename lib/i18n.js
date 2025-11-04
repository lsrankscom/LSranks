export const locales = ["en","de","nl","es","it","zh","ja"];
export const defaultLocale = "en";

export async function getMessages(locale){
  try {
    return (await import(`../messages/${locale}.json`)).default;
  } catch {
    return (await import(`../messages/en.json`)).default;
  }
}
