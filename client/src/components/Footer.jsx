import { assets } from '../assets/assets'
import { useLanguage } from '../context/LanguageContext'
import { translations } from '../locales/translation.js'

const Footer = () => {

    const { language } = useLanguage()
    const t = translations[language].footer

    return (
        <footer className="px-6 md:px-16 lg:px-36 mt-40 w-full text-gray-300">
            <div className="flex flex-col md:flex-row justify-between w-full gap-10 border-b border-gray-500 pb-14">
                <div className="md:max-w-96">
                    <img alt="" className="h-11" src={assets.logo} />
                    <p className="mt-6 text-sm">
                        Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.
                    </p>
                    <div className="flex items-center gap-2 mt-4">
                        <img src={assets.googlePlay} alt="google play" className="h-9 w-auto" />
                        <img src={assets.appStore} alt="app store" className="h-9 w-auto" />
                    </div>
                </div>
                <div className="flex-1 flex items-start md:justify-end gap-20 md:gap-40">
                    <div>
                        <h2 className="font-semibold mb-5">{t.company}</h2>
                        <ul className="text-sm space-y-2">
                            <li><a href="#">{translations[language].nav.home}</a></li>
                            <li><a href="#">{t.aboutUs}</a></li>
                            <li><a href="#">{t.contactUs}</a></li>
                            <li><a href="#">{t.privacyPolicy}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h2 className="font-semibold mb-5">{t.getInTouch}</h2>
                        <div className="text-sm space-y-2">
                            <p>Sebastian906</p>
                            <p>elsebas1912@gmail.com</p>
                        </div>
                    </div>
                </div>
            </div>
            <p className="pt-4 text-center text-sm pb-5">
                Copyright {new Date().getFullYear()} © <a href="https://prebuiltui.com">Sebastian906</a>. {t.rights}
            </p>
        </footer>
    )
}

export default Footer