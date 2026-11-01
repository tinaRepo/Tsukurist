import { createPublicPageMetadata } from "@/lib/seo";
import { getTool } from "@/lib/tools";
import ToolPageShell from "@/components/tools/ToolPageShell";
import DeadlineCalculator from "@/components/tools/DeadlineCalculator";
import { Section, P, Ul } from "@/components/GuideParts";

const tool = getTool("deadline-calculator")!;
export const metadata = createPublicPageMetadata(tool.title, tool.description, `/tools/${tool.slug}`);

export default function Page() {
  return (
    <ToolPageShell
      slug={tool.slug}
      lead="完成してほしい日を入れると、各工程をいつ始めて、いつまでに終えればよいかを逆算します。入力した内容はこのページの中だけで計算され、サーバーには送信されません。"
      explanation={
        <>
          <Section title="使いかた">
            <Ul>
              <li><strong>納期</strong>：完成品を受け取りたい日を選びます。</li>
              <li><strong>工程と日数</strong>：「ラフ」「確認」「本制作」「修正」など、依頼の流れに合わせて並べ、それぞれにかかる日数を入れます。工程は追加・削除できます。</li>
              <li><strong>余裕日数</strong>：納期の直前に空けておく予備の日数です。遅れや急な修正に備えます。</li>
              <li><strong>土日を作業日に数えない</strong>：オンにすると、土日をはさむ分だけ日程が前にずれます。祝日や年末年始は考慮しないので、該当する時期は余裕日数を多めにしてください。</li>
            </Ul>
          </Section>
          <Section title="結果の読みかた">
            <P>
              いちばん上の「依頼を出す最終日」が、逆算した着手日です。この日までに依頼先へ依頼を伝え、着手してもらう必要があります。すでに過ぎている場合は赤い警告が出て、約何日足りないかが表示されます。その場合は、納期を後ろにずらす、工程の日数を詰める、特急での対応を相談するといった判断材料になります。
            </P>
          </Section>
          <Section title="日程を組むときの考えかた">
            <Ul>
              <li><strong>確認の日数を甘く見ない</strong>：遅れの多くは、制作そのものより、確認や返信の待ち時間で起こります。確認に2日と置いたなら、自分が返信する日も含めて数えます。</li>
              <li><strong>修正の工程を必ず入れる</strong>：修正が一度もない依頼はまれです。修正の回数と日数を、あらかじめ工程として確保します。</li>
              <li><strong>余裕日数は工程の合計の1〜2割が目安</strong>：工程の合計が20日なら、2〜4日ほどです。</li>
              <li><strong>途中で日程が動いたら引き直す</strong>：状況が変わったときに、同じ画面で数字を変えて再計算できます。</li>
            </Ul>
          </Section>
        </>
      }
    >
      <DeadlineCalculator />
    </ToolPageShell>
  );
}
