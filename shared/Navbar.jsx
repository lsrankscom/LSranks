import Link from "next/link";
import {useTranslations} from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import {useRouter} from "next/router";

export default function Navbar(){
  const t = useTranslations("nav");
  const router = useRouter();
  const q = router.query?.lang ? `?lang=${router.query.lang}` : "";
  const NavLink = ({href, children}) => <Link href={`${href}${q}`}>{children}</Link>;

  return (
    <div className="container nav-wrap">
      <div className="brand">
        <span style={{fontSize:"1.35rem"}}>🏊‍♂️</span>
        <NavLink href="/"><span>LifesavingRankings</span></NavLink>
      </div>
      <div className="navlinks">
        <NavLink href="/competitions">{t("competitions")}</NavLink>
        <NavLink href="/calendar">{t("calendar")}</NavLink>
        <NavLink href="/records">{t("records")}</NavLink>
        <div>
          <span>{t("info")} ▾</span>
          <div className="card" style={{position:"absolute",marginTop:".4rem",display:"none"}} />
        </div>
        <NavLink href="/info">{t("info")}</NavLink>
        <NavLink href="/about">{t("about")}</NavLink>
        <NavLink href="/admin">{t("admin")}</NavLink>
        <LanguageSwitcher/>
      </div>
    </div>
  );
}
