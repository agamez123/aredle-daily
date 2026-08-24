import "./Footer.css"

function Footer() {
    return(
        <footer className="site-footer">
            <span className="site-footer__cube" aria-hidden="true">
                <span className="site-footer__cube-eye site-footer__cube-eye--left" />
                <span className="site-footer__cube-eye site-footer__cube-eye--right" />
                <span className="site-footer__cube-mouth" />
            </span>
            <span className="site-footer__line-mask site-footer__line-mask--cube" aria-hidden="true" />
            <span className="site-footer__spike" aria-hidden="true" />
            <span className="site-footer__line-mask site-footer__line-mask--spike" aria-hidden="true" />
        </footer>
    )
}

export default Footer
