import { createPublicPageMetadata } from "@/lib/seo";
import { getTool } from "@/lib/tools";
import ToolPageShell from "@/components/tools/ToolPageShell";
import CostCalculator from "@/components/tools/CostCalculator";
import { Section, P, Ul, Note } from "@/components/GuideParts";

const tool = getTool("outsourcing-cost")!;
export const metadata = createPublicPageMetadata(tool.title, tool.description, `/tools/${tool.slug}`);

export default function Page() {
  return (
    <ToolPageShell
      slug={tool.slug}
      lead="外注する項目と金額を入れると、特急料金・消費税・源泉徴収を含めた支払総額を計算します。入力した内容はこのページの中だけで計算され、サーバーには送信されません。"
      explanation={
        <>
          <Section title="使いかた">
            <Ul>
              <li><strong>項目</strong>：「デザイン制作」「修正対応（追加）」のように、見積もりの内訳を入れます。金額は税抜で、単価と数量を入力します。</li>
              <li><strong>特急料金</strong>：通常より急ぐ場合の割増を、％で入れます。小計に加算されます。</li>
              <li><strong>消費税</strong>：10％、8％、なし（免税事業者への支払いなど）から選びます。</li>
              <li><strong>源泉徴収</strong>：個人のデザイナー・ライター・イラストレーターなどへ支払う報酬が対象になる場合に、チェックを入れます。</li>
              <li><strong>作業時間</strong>：入れると、税抜金額を作業時間で割った時給換算が出ます。依頼先の単価が妥当かを見る目安になります。</li>
            </Ul>
          </Section>
          <Section title="計算のしくみ">
            <P>
              小計に特急料金を加えた金額を「税抜の支払対象額」とし、そこに消費税を加えます。源泉徴収を選んだときは、支払対象額（税抜）に対して、100万円以下の部分は10.21％、100万円を超える部分は20.42％の税額を計算し、支払総額から差し引きます。端数は切り捨てです。
            </P>
            <Note tone="warn">
              このツールは一般的な目安を出すためのものです。源泉徴収の対象になるかどうか、消費税の扱い、請求書に消費税を区分して記載しているかなどによって、実際の金額は変わります。実際の支払いや申告の前に、税理士や税務署などの案内で確認してください。
            </Note>
          </Section>
          <Section title="外注費を見積もるときのポイント">
            <Ul>
              <li><strong>修正の範囲を先に決める</strong>：「修正は2回まで、それ以降は1回あたり○円」のように、追加費用の基準を項目に入れておくと、あとでもめにくくなります。</li>
              <li><strong>利用範囲で金額が変わる</strong>：商用利用や、広告での長期利用を含むかどうかで、報酬が変わることがあります。見積もり前に伝えましょう。</li>
              <li><strong>特急は依頼先と相談して決める</strong>：割増の率に決まりはありません。納期に余裕がないときほど、事前に相談して合意しておくことが大切です。</li>
              <li><strong>複数の依頼先で、同じ条件で比べる</strong>：同じ項目・数量でこのツールに入れて並べると、総額の違いが見えます。</li>
            </Ul>
          </Section>
        </>
      }
    >
      <CostCalculator />
    </ToolPageShell>
  );
}
