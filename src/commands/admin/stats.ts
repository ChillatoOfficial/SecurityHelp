import type { Command } from '../types'
import { requireGroupAndAdmin } from '../../utils/permissions'
import { sendCard } from '../../utils/card'
import { getLastNDaysSeries, analyzeTrend, adviceForTrend, quickChartUrl, calcAvg } from '../../utils/store'

const stats: Command = {
  name: 'stats',
  description: 'Statistiche messaggi + grafico + consigli',
  permission: "admin",
  groupOnly: true,

  async run({ sock, from, sender, args }) {
    const gate = await requireGroupAndAdmin(sock, from, sender)
    if (!gate.ok) {
      await sendCard(sock, {
        jid: from,
        image: "assets/dany.png",
        title: "*⛔ ACCESSO NEGATO ⛔*",
        message: "`" + gate.reason! + "`"
      })
      return
    }

    const days = Math.min(30, Math.max(7, parseInt(args[0] || "7", 10) || 7))
    const { labels, values } = getLastNDaysSeries(from, days)

    const total = values.reduce((a, b) => a + b, 0)
    const avg = Math.round(calcAvg(values))
    const { trend, deltaPct } = analyzeTrend(values)

    const trendText =
      trend === "growth" ? `CRESCITA (+${deltaPct.toFixed(0)}%)` :
      trend === "decline" ? `CALO (${deltaPct.toFixed(0)}%)` :
      trend === "stable" ? `STABILE (${deltaPct.toFixed(0)}%)` :
      `INSUFFICIENTE`

    const advice = adviceForTrend(trend)

    const url = quickChartUrl(labels, values)

    await sock.sendMessage(from, {
      image: { url },
      caption:
        `📊 *STATS ${days}G*\n\n` +
        `🧮 Totale: *${total}*\n` +
        `📈 Media/giorno: *${avg}*\n` +
        `📉 Trend: *${trendText}*\n\n` +
        `${advice}\n\n` +
        `👤 Richiesto da: @${sender.split("@")[0]}`,
      mentions: [sender]
    })
  }
}

export default stats
