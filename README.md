# AGNIS: The Chess Review App

## Steps to use this application

Edit file `src/uti;s/chessUtil.ts` line 7 and enter your OpenAI API Key.

- Run `npm run dev` 
- Open the URL in your browser
- Load a PGN, a Sample PGN is as follows (taken from https://www.chess.com/article/view/the-best-chess-games-of-all-time#Kasparov_Topalov)
- Click `Load PGN`, once loaded, the button should change to Engine Analysis
- Click `Engine Analysis` it should display a progress bar and turn to AI Analysis
- Click `AI Analysis` and wait a few minutes
- Once done, it will take you to the analysis page. You can copy the URL and come back to this page, the data is saved to local storage.

```
[Event "It (cat.17)"]
[Site "Wijk aan Zee (Netherlands)"]
[Date "1999.??.??"]
[Round "?"]
[White "Garry Kasparov"]
[Black "Veselin Topalov"]
[Result "1-0"]

1. e4 d6 2. d4 Nf6 3. Nc3 g6 4. Be3 Bg7 5. Qd2 c6 6. f3 b5 7. Nge2 Nbd7 8. Bh6
Bxh6 9. Qxh6 Bb7 10. a3 e5 11. O-O-O Qe7 12. Kb1 a6 13. Nc1 O-O-O 14. Nb3 exd4
15. Rxd4 c5 16. Rd1 Nb6 17. g3 Kb8 18. Na5 Ba8 19. Bh3 d5 20. Qf4+ Ka7 21. Rhe1
d4 22. Nd5 Nbxd5 23. exd5 Qd6 24. Rxd4 cxd4 25. Re7+ Kb6 26. Qxd4+ Kxa5 27. b4+
Ka4 28. Qc3 Qxd5 29. Ra7 Bb7 30. Rxb7 Qc4 31. Qxf6 Kxa3 32. Qxa6+ Kxb4 33. c3+
Kxc3 34. Qa1+ Kd2 35. Qb2+ Kd1 36. Bf1 Rd2 37. Rd7 Rxd7 38. Bxc4 bxc4 39. Qxh8
Rd3 40. Qa8 c3 41. Qa4+ Ke1 42. f4 f5 43. Kc1 Rd2 44. Qa7 1-0
```

