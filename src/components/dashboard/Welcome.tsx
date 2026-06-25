import { Icon } from '../Icon'

/** card de boas-vindas mostrado quando o usuário ainda não tem lançamentos */
export function Welcome() {
  return (
    <section className="card welcome">
      <h2 className="ttl">&gt;_ bem-vindo(a)!</h2>
      <p className="small">seu painel tá zerado — bora dar o primeiro passo:</p>
      <ul className="insights" style={{ marginTop: 10 }}>
        <li className="insight">
          <Icon name="camera" className="ins-ico" />
          <span>
            <b>escaneie uma nota fiscal</b> — a ia lança automático pra você
          </span>
        </li>
        <li className="insight">
          <Icon name="edit" className="ins-ico" />
          <span>
            ou <b>adicione manual</b> no "novo lançamento" aqui embaixo
          </span>
        </li>
        <li className="insight">
          <Icon name="chart" className="ins-ico" />
          <span>conforme você usa, surgem os números, o gráfico e os insights</span>
        </li>
      </ul>
    </section>
  )
}
