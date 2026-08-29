import "./Footer.css"

const LINKS = [
  { href: "https://aredl.net", label: "AREDL" },
  { href: "https://songfilehub.com", label: "Song File Hub" },
  { href: "https://gdbrowser.com", label: "GDBrowser" },
]

function Footer() {
  return (
    <footer className="site-footer">
      <span className="site-footer__cube" aria-hidden="true">
        <span className="site-footer__cube-eye site-footer__cube-eye--left" />
        <span className="site-footer__cube-eye site-footer__cube-eye--right" />
        <span className="site-footer__cube-mouth" />
      </span>
      <span className="site-footer__line-mask site-footer__line-mask--cube" aria-hidden="true" />
      <span className="site-footer__spike" aria-hidden="true" />
      <span className="site-footer__line-mask site-footer__line-mask--spike" aria-hidden="true" />
      <span className="site-footer__text">
        Level data from{" "}
        {LINKS.map((link, i) => (
          <span key={link.href}>
            <a href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
            {i < LINKS.length - 1 ? " · " : ""}
          </span>
        ))}
        . Not affiliated with RobTop Games.
      </span>
      <span className="site-footer__credit">
        made with <span aria-label="love">❤️</span> by agamez
      </span>
    </footer>
  )
}

export default Footer
