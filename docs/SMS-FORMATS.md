# Vodafone Cash confirmation SMS (redacted structure)

Two kinds of message reach the phone, and only one of them may ever count as income.

RECEIVED (counts): "تم استلام مبلغ <AMOUNT> جنيه من رقم <SENDER> المسجل بإسم <NAME> على رقم محفظتك <WALLET>. رصيدك الحالي: <BALANCE> جنيه. تاريخ العملية: <TIME DATE>. رقم العملية: <TXID>"

SENT (never counts): "تم تحويل <AMOUNT> جنيه لرقم <RECIPIENT> مصاريف الخدمة 1 جنيه ... رقم العملية <TXID>"

Rules enforced by src/features/cash.js:
1. The message must contain "تم استلام" (or "you received") and must NOT contain "تم تحويل" (or "you sent").
2. The wallet number from CASH_NUMBER must appear in the message.
3. The amount comes from "مبلغ <n> جنيه" and the transaction number from "رقم العملية".
4. Arabic-Indic digits are converted first.
5. If CASH_SMS_SENDERS is set, the forwarder's sender must be on the list.
