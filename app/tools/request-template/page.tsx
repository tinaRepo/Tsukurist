import { createPublicPageMetadata } from "@/lib/seo";
import { getTool } from "@/lib/tools";
import ToolPageShell from "@/components/tools/ToolPageShell";
import RequestTemplate from "@/components/tools/RequestTemplate";
import { Section, P, Ul, Note } from "@/components/GuideParts";

const tool = getTool("request-template")!;
export const metadata = createPublicPageMetadata(tool.title, tool.description, `/tools/${tool.slug}`);

export default function Page() {
  return (
    <ToolPageShell
      slug={tool.slug}
      lead="依頼内容を入力すると、そのままメールやチャットで送れる依頼書の文面ができあがります。入力した内容はこのページの中だけで処理され、サーバーには送信されません。"
      explanation={
        <>
          <Section title="使いかた">
            <Ul>
              <li>上のフォームに、わかる範囲で入力します。空欄の項目は「未定」と表示されます。</li>
              <li>下の「依頼書の文面」に、入力内容に合わせて文章が作られます。</li>
              <li>「コピー」でメールやチャットに貼り付けるか、「テキストで保存」でファイルとして残せます。</li>
            </Ul>
          </Section>
          <Section title="なぜ依頼書で整理するのか">
            <P>
              外注のトラブルの多くは、「言った・言わない」と「思っていたものと違う」から起こります。仕様、納期、修正の回数、報酬、利用範囲を、最初に文章で共有しておくだけで、後からの行き違いはかなり減ります。依頼先にとっても、条件がはっきりしている依頼は、受けるかどうかの判断が早くできます。
            </P>
          </Section>
          <Section title="各項目で書いておきたいこと">
            <Ul>
              <li><strong>目的・背景</strong>：何のために使うのかが伝わると、依頼先から良い提案をもらいやすくなります。</li>
              <li><strong>仕様</strong>：サイズ、枚数、色、雰囲気、参考にしたい例、支給する素材などを具体的に書きます。</li>
              <li><strong>スケジュール</strong>：納期だけでなく、途中確認の日を決めておくと、大きな方向違いを早めに直せます。</li>
              <li><strong>修正の回数</strong>：何回まで含むか、超えたときはどうするかを書きます。</li>
              <li><strong>利用範囲・クレジット</strong>：商用利用の可否、公開する場所、制作者名の表記が必要かどうかを決めておきます。</li>
            </Ul>
          </Section>
          <Note tone="warn">
            この文面は、依頼の内容を整理して共有するための下書きです。契約書ではなく、法的な効力を保証するものではありません。金額が大きい依頼や、著作権の扱いが重要な依頼では、必要に応じて契約書を取り交わすことをおすすめします。
          </Note>
        </>
      }
    >
      <RequestTemplate />
    </ToolPageShell>
  );
}
