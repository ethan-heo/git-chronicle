
## [1.8.0](https://github.com/ethan-heo/git-chronicle/compare/v1.7.1...v1.8.0) (2026-07-18)

### Features

* **commit-groups:** add saved commit group filters ([57420a9](https://github.com/ethan-heo/git-chronicle/commit/57420a9a215c0f064daac22ded96b91479bf960b))

### Bug Fixes

* hide empty workspace tab bar ([ba107aa](https://github.com/ethan-heo/git-chronicle/commit/ba107aacb781b31568e93014b314f54451a1101d))
* **commit-groups:** compact selection action bar ([faa3dcc](https://github.com/ethan-heo/git-chronicle/commit/faa3dcc11a070a0558ac0d143c46fb3d3472bfd0))

## [1.7.1](https://github.com/ethan-heo/git-chronicle/compare/v1.7.0...v1.7.1) (2026-07-14)

### Features

* move commit panel actions into commit list hover buttons ([b5eb802](https://github.com/ethan-heo/git-chronicle/commit/b5eb8020ed6b0cded8ffa75fdde8dd79a6308a85))

### Bug Fixes

* simplify workspace tab bar styling ([eb741d4](https://github.com/ethan-heo/git-chronicle/commit/eb741d43af06352f100fc267006fb55d10db6dfa))

## [1.7.0](https://github.com/ethan-heo/git-chronicle/compare/v1.6.0...v1.7.0) (2026-07-13)

### Features

* **f11:** add table live preview to note editor ([3240ba8](https://github.com/ethan-heo/git-chronicle/commit/3240ba89f2659bbf32fe07bd9fb5af5514524058))
* add workspace tab keyboard shortcuts ([d505be7](https://github.com/ethan-heo/git-chronicle/commit/d505be740b2719815dae498f3e94e94211bcf158))
* **workspace:** clarify split pane tab visibility state ([c69bac8](https://github.com/ethan-heo/git-chronicle/commit/c69bac8657e447efac03b825543e46f4ec270889))
* **workspace:** isolate sidebar context from tab focus changes ([1ba97d5](https://github.com/ethan-heo/git-chronicle/commit/1ba97d5b864aaa8124f08bac1bb491365630259b))

### Bug Fixes

* **workspace:** route close-tab shortcut through host ([00c0f3a](https://github.com/ethan-heo/git-chronicle/commit/00c0f3af149b9d671658ac2a4600f4b28c1f9ca5))
* **dependency:** stabilize dependency cruiser execution ([da5f920](https://github.com/ethan-heo/git-chronicle/commit/da5f920247fc48d7f7c3373d6fdf67954208d50a))
* **workspace:** guard code panels during file-tree loading ([6cbe1af](https://github.com/ethan-heo/git-chronicle/commit/6cbe1af865d1fff4e479cd9eb4cb07062cd9ebe0))
* **notes:** stabilize folded-block cursor navigation ([6a6f56a](https://github.com/ethan-heo/git-chronicle/commit/6a6f56af6ec4852ed09509dc00c22d6754ffc433))

## [1.6.0](https://github.com/ethan-heo/git-chronicle/compare/v1.5.0...v1.6.0) (2026-07-13)

### Features

* simplify copied markdown output ([d3a639f](https://github.com/ethan-heo/git-chronicle/commit/d3a639f1df732313cb0ecb7e91b1c6a294e71b88))
* **workspace:** isolate split pane file diffs ([c6f697d](https://github.com/ethan-heo/git-chronicle/commit/c6f697dfbe1b0a93bad5cecb2740179f07a2b6f5))
* **f11:** add live preview markdown note editor ([3d95139](https://github.com/ethan-heo/git-chronicle/commit/3d95139004e91b7279d5c67b830b04c24f625474))

### Bug Fixes

* restore note tab badge label ([76ab6eb](https://github.com/ethan-heo/git-chronicle/commit/76ab6ebd9b289bdb5ddbe42fbf8e2b9697115ce0))
* **notes:** prevent cursor jump below markdown horizontal rules ([0f0bf12](https://github.com/ethan-heo/git-chronicle/commit/0f0bf12b2765fb1efaea63df3cc783e95a78cc42))
* **f11:** preserve vertical cursor movement on hidden markdown syntax ([1b573ad](https://github.com/ethan-heo/git-chronicle/commit/1b573ad71ef650b4832a6a10d597499b98a8e658))
* **f11:** stabilize mermaid widget cursor navigation ([606f2fd](https://github.com/ethan-heo/git-chronicle/commit/606f2fdae9f981f7f4005250b6cca9b577735ba4))
* **note:** prevent editor autosave status flicker ([a9874e0](https://github.com/ethan-heo/git-chronicle/commit/a9874e00385f9eedeaa39586eaf757b9efd6ebcf))
* **workspace:** limit active tab styling to focused pane ([301ff14](https://github.com/ethan-heo/git-chronicle/commit/301ff14dc99ca225ab3c02cc7b912f66dcbba66f))

## [1.5.0](https://github.com/ethan-heo/git-chronicle/compare/v1.4.0...v1.5.0) (2026-07-12)

### Features

* **f05b:** add folder suggestion dropdown for save path ([d001715](https://github.com/ethan-heo/git-chronicle/commit/d00171577d4f7038be45214aeef0df92e5bab4d4))
* **ai-summary:** improve save path popover autocomplete ([03302b1](https://github.com/ethan-heo/git-chronicle/commit/03302b1a0fab19e38df89835a06a5e783e92b61a))
* **note:** reopen ai summary notes in summary tabs ([c6aff72](https://github.com/ethan-heo/git-chronicle/commit/c6aff72e43ada47ae3c8921f297f7524f562b7ee))
* **webview:** unify icon button accessibility and styling ([ca9d7bf](https://github.com/ethan-heo/git-chronicle/commit/ca9d7bf6459dcbe6bc53ae4fbfdfcb87e1715d1b))
* replace note sidebar text actions with icons ([9ccb3d4](https://github.com/ethan-heo/git-chronicle/commit/9ccb3d42413fcb498e8a07df1f7cb894274ec4a2))
* **notes:** save ai summaries as notes ([f13adec](https://github.com/ethan-heo/git-chronicle/commit/f13adec19b0259c34ade7ff59bbfa4478932dac4))
* add standalone notes workspace ([e6bbcf3](https://github.com/ethan-heo/git-chronicle/commit/e6bbcf306877775403d29df04cdf30fbe150978d))
* **workspace:** merge dragged tabs into existing panes ([7cf0a1a](https://github.com/ethan-heo/git-chronicle/commit/7cf0a1a69944bb3ecb5c99fa9538a69f969b34b3))

### Bug Fixes

* **workspace:** move notes section below changed files ([b301c7b](https://github.com/ethan-heo/git-chronicle/commit/b301c7bb61b01fe4993f3f4c1cbed3ad97ecfd76))

## [1.4.0](https://github.com/ethan-heo/git-chronicle/compare/v1.3.0...v1.4.0) (2026-07-10)

### Features

* add related commits to GitHub detail tabs ([38daa97](https://github.com/ethan-heo/git-chronicle/commit/38daa97c4b1ab2154838c83f32e838aca0ea74eb))
* **github:** improve PR and issue markdown readability ([225151c](https://github.com/ethan-heo/git-chronicle/commit/225151c838153fb07f1d495112b5edcf6d75c901))
* **f12:** improve github markdown rendering ([48d3ac6](https://github.com/ethan-heo/git-chronicle/commit/48d3ac62ee611d916f1c3f9da5877faf9c5c648e))
* **github:** add PR and issue workspace panels ([79a7744](https://github.com/ethan-heo/git-chronicle/commit/79a77444672eadb0e187267e9f5072e81c48625d))

### Bug Fixes

* hide initial related commits loading state ([9d7591e](https://github.com/ethan-heo/git-chronicle/commit/9d7591ed9dd612470d2c62102f06d938b5348d23))

## [1.3.0](https://github.com/ethan-heo/git-chronicle/compare/v1.2.0...v1.3.0) (2026-07-10)

### Features

* **extension:** add new window command and refresh AI models ([c1031d5](https://github.com/ethan-heo/git-chronicle/commit/c1031d5364252bee88650f170c87d5570c5fc003))
* **workspace:** localize summary save names and pane actions ([6805b26](https://github.com/ethan-heo/git-chronicle/commit/6805b26e77d10bf3ae6ef6642678f6f2a7b6225a))
* **workspace:** merge sidebar filters into commit section ([4284a54](https://github.com/ethan-heo/git-chronicle/commit/4284a545bc4ed14a2fde452368faa3a6ef56023b))
* **workspace:** move file ai and symbol panels into code tabs ([dbcb631](https://github.com/ethan-heo/git-chronicle/commit/dbcb63134776a356e3fcd18af6457b77b0451d56))
* **workspace:** add S02 split view panes ([994090f](https://github.com/ethan-heo/git-chronicle/commit/994090fbe9f31609bcfdfc5f3d7a87341d5cfa5f))
* **workspace:** add tabbed workspace shell ([1bb0641](https://github.com/ethan-heo/git-chronicle/commit/1bb0641c139ea60e826d768d7c97291ce926b416))
* **s02:** move settings into sidebar funnel ([a62ee21](https://github.com/ethan-heo/git-chronicle/commit/a62ee2155a31c6dfcae477fa9feb7016ecce9e02))
* **workspace:** merge commit flow into sidebar workspace ([2215a5a](https://github.com/ethan-heo/git-chronicle/commit/2215a5a14c2cf52302df3875092672bad2dc4e05))

### Bug Fixes

* **workspace-tabs:** preserve selected commit after closing last tab ([8ad9c27](https://github.com/ethan-heo/git-chronicle/commit/8ad9c27a744a0560429fbc00edfb13fce7ed781f))
* **workspace:** preserve selected commit state ([59cc670](https://github.com/ethan-heo/git-chronicle/commit/59cc670fd65f7d0f3864c803a8ded84cb8cd0479))
* **sidebar:** expand section header toggle hit area ([142c8ec](https://github.com/ethan-heo/git-chronicle/commit/142c8ec73fa3c203c110dbe6aa87d3727051e33e))

## [1.2.0](https://github.com/ethan-heo/git-chronicle/compare/v1.1.2...v1.2.0) (2026-07-08)

### Features

* **highlighter:** add shared markdown code syntax highlighting ([2172762](https://github.com/ethan-heo/git-chronicle/commit/2172762d4bcfa4712795e2822b1f6296b12fea62))
* preserve markdown source copy in AI summaries ([aac064a](https://github.com/ethan-heo/git-chronicle/commit/aac064a53c517fff328583f847c0e252137d6511))

### Bug Fixes

* **webview:** keep note preview pane height bounded ([a70c665](https://github.com/ethan-heo/git-chronicle/commit/a70c66525e94c5cbfa24cb59a5284f5e9a3ac601))
* preserve file ai summary context across detail navigation ([e933eb9](https://github.com/ethan-heo/git-chronicle/commit/e933eb9799a8b8ec8a2db395b07048e1fac5ca36))
* reposition canvas copy buttons below nodes ([41cb99b](https://github.com/ethan-heo/git-chronicle/commit/41cb99b2e1e28258d5a948bfc4b3e58466ec057c))
* stabilize ai summary mermaid preview ([3b213dc](https://github.com/ethan-heo/git-chronicle/commit/3b213dcbefb00d548ae181f94dc6a42525582e3b))
* restore mermaid rendering in ai summary viewer ([5a0a559](https://github.com/ethan-heo/git-chronicle/commit/5a0a5596dd71840a14ed0d87d8a008f458b5c01c))
* preserve AI summary markdown copy syntax ([67d901a](https://github.com/ethan-heo/git-chronicle/commit/67d901a2eeeb04c14eb2783bf728f1fea8fe8bea))
* tighten tsconfig lookup and clean cli install link ([aa1e19f](https://github.com/ethan-heo/git-chronicle/commit/aa1e19ff0ffdeed99b5468b69a6526e8d5b3e88d))

## [1.1.2](https://github.com/ethan-heo/git-chronicle/compare/v1.1.1...v1.1.2) (2026-07-07)

### Bug Fixes

* restore workspace file tree scrolling ([9fa0144](https://github.com/ethan-heo/git-chronicle/commit/9fa0144a1bc8fb6e517ad4aa0ff7b61e03192f09))

## [1.1.1](https://github.com/ethan-heo/git-chronicle/compare/v1.1.0...v1.1.1) (2026-07-07)

### Bug Fixes

* restore F10 symbol code viewer vertical scrolling ([becf8c6](https://github.com/ethan-heo/git-chronicle/commit/becf8c69c49602f282e132ad51cbe2eae895208a))

## [1.1.0](https://github.com/ethan-heo/git-chronicle/compare/v1.0.0...v1.1.0) (2026-07-07)

### Features

* improve diff viewer folding ([c1fbe76](https://github.com/ethan-heo/git-chronicle/commit/c1fbe7682ba77341a130c16975da20296c26b62a))

### Bug Fixes

* **f10:** remove symbol code panel background ([8cd4e06](https://github.com/ethan-heo/git-chronicle/commit/8cd4e063c76f92d0564f977ccea69c9284fba7b3))

### Documentation

* clarify commit message requirements in agent guides ([1c2134d](https://github.com/ethan-heo/git-chronicle/commit/1c2134d1869522fd84e4a3395d0300e93c3a44ec))
* add doc summaries ([4c09de7](https://github.com/ethan-heo/git-chronicle/commit/4c09de73b9da4b97f5bfbbf11e9f486231f1da19))
* sync workspace screen documentation ([9cb83a2](https://github.com/ethan-heo/git-chronicle/commit/9cb83a25f047ffd1fd4023695887a6e5cf2da455))

## [1.0.0](https://github.com/ethan-heo/git-chronicle/compare/v0.8.0...v1.0.0) (2026-07-07)

### Features

* include commit messages in AI summary prompts ([7bb1e01](https://github.com/ethan-heo/git-chronicle/commit/7bb1e01dce4d244831f3b1e262b3e5b1e7d483e6))
* improve note preview rendering ([95bf4e8](https://github.com/ethan-heo/git-chronicle/commit/95bf4e836754bf5399faf6bcba571029d4ff76d8))
* add note editor and markdown copy workflows ([005f7ef](https://github.com/ethan-heo/git-chronicle/commit/005f7ef4ff83c011f3ed0d1b4e9052cea1ca12b1))
* refine workspace sidebar interactions ([60d0df5](https://github.com/ethan-heo/git-chronicle/commit/60d0df5cadbc7b12042d8bfc62f1f77191f5c505))
* improve S02 sidebar interactions ([a9a2738](https://github.com/ethan-heo/git-chronicle/commit/a9a2738527e118fc9b430106ce99f0280f1ed047))
* **webview:** redesign workspace layout ([500cc41](https://github.com/ethan-heo/git-chronicle/commit/500cc416d7a5bc01c475ad068d8dfc11c9447024))

### Bug Fixes

* **note:** serialize mermaid preview rendering ([7c23328](https://github.com/ethan-heo/git-chronicle/commit/7c2332898142cc8d62b0cee832b2849ae220ee93))
* **webview:** normalize ai summary markdown preview ([d545176](https://github.com/ethan-heo/git-chronicle/commit/d5451765d4d29afb1b297606f6b34518398431d1))
* **ai-summary:** separate commit and file summary flows ([f1d1ddc](https://github.com/ethan-heo/git-chronicle/commit/f1d1ddc0d6fb8c4d12072b17055fdc1276533037))
* **workspace:** remove main header collapse button ([d009369](https://github.com/ethan-heo/git-chronicle/commit/d0093694b651fdd72ccf110df3a597f82113a26a))

### Documentation

* add plan writing guide ([f06f0a2](https://github.com/ethan-heo/git-chronicle/commit/f06f0a23bc602d8c1ff99c340b629be3284805e0))
* clarify stale documentation cleanup rules ([c65c4b6](https://github.com/ethan-heo/git-chronicle/commit/c65c4b6f15d8a90d6ec7e5ec6e81258eb97c723d))
* reorganize documentation guides ([581850c](https://github.com/ethan-heo/git-chronicle/commit/581850c1c5800cbb8499c3b8969a7f0a3a10afa3))
* reorganize documentation structure ([7d5ab6a](https://github.com/ethan-heo/git-chronicle/commit/7d5ab6aaefd0e426e2e94691bfd55a0038f1f5f5))

## [0.8.0](https://github.com/ethan-heo/git-chronicle/compare/v0.7.1...v0.8.0) (2026-07-01)

### Features

* refine ai summary action labels ([62e2406](https://github.com/ethan-heo/git-chronicle/commit/62e24063c5d2a4aaf6a75425f71207ae1135d660))
* improve ai summary qa viewer ux ([20a8b4c](https://github.com/ethan-heo/git-chronicle/commit/20a8b4c0be63274bfd72598459aedf471a714b4d))

### Bug Fixes

* improve F10 symbol rendering ([dfe8b66](https://github.com/ethan-heo/git-chronicle/commit/dfe8b66b029b13237b07cf43fc0cfd08318d4860))

## [0.7.1](https://github.com/ethan-heo/git-chronicle/compare/v0.7.0...v0.7.1) (2026-06-30)

### Features

* update ai provider models and cli handling ([c8f3f6a](https://github.com/ethan-heo/git-chronicle/commit/c8f3f6a8815effdf8c88ee79a50954acf6ae1083))
* add import nodes to symbol graph ([96caa53](https://github.com/ethan-heo/git-chronicle/commit/96caa53f5e1d46bc767878b2efc19a4458107dda))

### Documentation

* update README feature and settings details ([7cd626a](https://github.com/ethan-heo/git-chronicle/commit/7cd626a0962e66588f5b12434ab8c0a7408fc7c5))
* clarify README feature support ([0ac5f13](https://github.com/ethan-heo/git-chronicle/commit/0ac5f135031866f29a55cb85479bb81e9f7e2946))

## [0.7.0](https://github.com/ethan-heo/git-chronicle/compare/v0.6.0...v0.7.0) (2026-06-29)

### Features

* refine AI summary loading and QA formatting ([1fa8d89](https://github.com/ethan-heo/git-chronicle/commit/1fa8d892f00b44202e0cc66c04348457635f1fca))
* scope AI settings per workspace ([d61e55f](https://github.com/ethan-heo/git-chronicle/commit/d61e55f5bffeb38bd437d308cd9784be2b916df4))

## [0.6.0](https://github.com/ethan-heo/git-chronicle/compare/v0.5.2...v0.6.0) (2026-06-29)

### Features

* add AI model switching and summary Q&A ([0fbffca](https://github.com/ethan-heo/git-chronicle/commit/0fbffca85164fcc67545ef3c2ec18f96f473d156))
* add resizable split pane ([c4b7503](https://github.com/ethan-heo/git-chronicle/commit/c4b7503aa9c7f8dd9669f7b9ed5e325c71ac7e29))

### Bug Fixes

* prevent code viewer loading from hanging ([a741898](https://github.com/ethan-heo/git-chronicle/commit/a7418982b313f98ecfb90835c6600e47fb32bd99))
* reset code viewer ai summary state ([36c8d53](https://github.com/ethan-heo/git-chronicle/commit/36c8d535a08b3928eb4656f9797b9a8113df7a2b))

### Documentation

* update CHANGELOG ([12f708c](https://github.com/ethan-heo/git-chronicle/commit/12f708cc73c283dbd33f0d0d359dc0292aca4f27))

## [0.5.2](https://github.com/ethan-heo/git-chronicle/compare/v0.5.1...v0.5.2) (2026-06-29)

### Bug Fixes

* regenerate changelog after release ([af8730a](https://github.com/ethan-heo/git-chronicle/commit/af8730ab3f5a50401ccc6be884e0c3ad2187f598))
* improve F01 commit log filtering ([b6343f1](https://github.com/ethan-heo/git-chronicle/commit/b6343f1280dfc4e550d684aa1e2dddbc3342f38e))
* reset f10 graph selection on pane click ([8ab9347](https://github.com/ethan-heo/git-chronicle/commit/8ab9347e41254ed34f0b3b4cde3c3796e4b398fd))
* correct symbol range highlighting ([1379e0e](https://github.com/ethan-heo/git-chronicle/commit/1379e0e3dc49f054ffe317080522ed50b73a5a05))

### Documentation

* add release workflow guide ([e6f26f4](https://github.com/ethan-heo/git-chronicle/commit/e6f26f421a3c17e2270c145f3dad071d1bc0b807))

## [0.5.1](https://github.com/ethan-heo/git-chronicle/compare/03387789ac76f4979b229567281c082f5ae3d9a0...v0.5.1) (2026-06-29)

### Features

* inline split panel for code and ai summary ([37e8236](https://github.com/ethan-heo/git-chronicle/commit/37e8236a0c9035aff7e8cc05c41fe82b76984263))
* **f10:** refine symbol graph code panel behavior ([b8e5bea](https://github.com/ethan-heo/git-chronicle/commit/b8e5bea2773fa35def50c5659d377e03db4e2c72))
* make F10 legend collapsible ([e684aab](https://github.com/ethan-heo/git-chronicle/commit/e684aab37157213e7cdb63221ce8bcc8886b15ce))
* add slide-in code panel for symbol graph ([3a520f9](https://github.com/ethan-heo/git-chronicle/commit/3a520f958516293709febd5297d210fa9c3cbc21))
* add intra-file symbol dependency canvas ([34de635](https://github.com/ethan-heo/git-chronicle/commit/34de6356e17b00ea158179b3b49d8e88dc5a7263))
* refine dependency canvas highlighting ([b1c441a](https://github.com/ethan-heo/git-chronicle/commit/b1c441a642d00ff00e29ce1216a3759da9fb3172))
* prevent dependency edge overlap ([8359e6a](https://github.com/ethan-heo/git-chronicle/commit/8359e6aa3158a3671ab2e8165e39cba42342be03))
* localize ui and docs ([364b376](https://github.com/ethan-heo/git-chronicle/commit/364b376c2f8c515ad56471196a8bab4ff7550b23))
* update dependency service packaging ([29f53f1](https://github.com/ethan-heo/git-chronicle/commit/29f53f18ebc86b5e6acc21746b37934cc11177a8))
* expand dependency canvas language support ([a010150](https://github.com/ethan-heo/git-chronicle/commit/a0101506315dc4dfe69e48c206e62448ab74edc8))
* show full file diff in F03 ([e6afbf8](https://github.com/ethan-heo/git-chronicle/commit/e6afbf8d31fa8f257bd19ea290ffd9ad3e272876))
* **f01:** improve commit filters ([7f6ee75](https://github.com/ethan-heo/git-chronicle/commit/7f6ee75a1e641a103b19d1878f34410b3eb219f5))
* **webview:** add split code and AI summary view ([d7658e1](https://github.com/ethan-heo/git-chronicle/commit/d7658e1b1f7759a73487e640d6f82f042f671548))
* improve dependency graph layout and interactions ([7941e68](https://github.com/ethan-heo/git-chronicle/commit/7941e68660c5e5e64f56478ac9335858c889aa6a))
* improve AI summary save paths ([7e7399f](https://github.com/ethan-heo/git-chronicle/commit/7e7399f4185adfe0b27fb89b02a07ae008ae9aab))
* persist commit filters in webview state ([6c9f7ff](https://github.com/ethan-heo/git-chronicle/commit/6c9f7ff1be1d5aef45a977e4d17063b1a678e0f4))
* add funnel route transitions ([d965a19](https://github.com/ethan-heo/git-chronicle/commit/d965a19e67cf7b0d5709508256a696016140c9d5))
* implement batch AI summary ([b14d3c5](https://github.com/ethan-heo/git-chronicle/commit/b14d3c573aa9fb004ad734fd6dd8784b068fbd50))
* implement save path settings ([250dc1b](https://github.com/ethan-heo/git-chronicle/commit/250dc1bf4ed3e5849debc349218cee158814cadb))
* implement AI settings screen ([2afef65](https://github.com/ethan-heo/git-chronicle/commit/2afef651dbb0dffb0676b43e373831c010f90b80))
* implement commit-level AI summaries ([0c3f5a5](https://github.com/ethan-heo/git-chronicle/commit/0c3f5a569ed1dbd6d65238ad63f86f966dcdcd44))
* implement file AI summary ([55e4b3e](https://github.com/ethan-heo/git-chronicle/commit/55e4b3ecbd6662e069ba88ac1e041d511a3cbe3f))
* implement dependency canvas ([b61b926](https://github.com/ethan-heo/git-chronicle/commit/b61b926acb4b7b4e2804cb06b8130ce8e10a22c9))
* implement F03 code viewer ([caa7208](https://github.com/ethan-heo/git-chronicle/commit/caa720840a5a3f3265eaed2fa86e5380047d16c8))
* implement changed file tree ([b0511ed](https://github.com/ethan-heo/git-chronicle/commit/b0511ed0f772a998dc3d1753e684279b736ae7c5))
* implement F01 commit log ([1847c77](https://github.com/ethan-heo/git-chronicle/commit/1847c777d46a2be66c7d2008eea3dabd56e1faf1))
* add webview design system ([7d7c05a](https://github.com/ethan-heo/git-chronicle/commit/7d7c05a30144226d357b73aadd1ee331657c6386))

### Bug Fixes

* localize F10 symbol graph ui ([e7549d1](https://github.com/ethan-heo/git-chronicle/commit/e7549d11ffd98d48ef8c7d653d7dbecc5cce09c7))
* improve dependency edge hover visibility ([171a296](https://github.com/ethan-heo/git-chronicle/commit/171a296b622220389889f30c8266fc848bfdee1f))
* restore dependency canvas edge rendering ([63e3f8d](https://github.com/ethan-heo/git-chronicle/commit/63e3f8d7202e9a528ab78a31eeef1b420806689e))
* stabilize dependency cruiser packaging ([1bfb26e](https://github.com/ethan-heo/git-chronicle/commit/1bfb26e2b8251c5a2bc29ba2a969cd39606ee9b0))
* **dependency:** normalize alias-resolved paths ([f8e9835](https://github.com/ethan-heo/git-chronicle/commit/f8e98358e5fc914fe66c1ae7945e8d49b0d3edef))
* improve dependency canvas analysis ([916a7dd](https://github.com/ethan-heo/git-chronicle/commit/916a7dde3a374c86ecd6bfcc509f5b747d6fb3f4))
* **f01:** read ascending commits from full log ([6601259](https://github.com/ethan-heo/git-chronicle/commit/6601259a3213cb6871e9a5def2e2ae140463a617))
* preserve commit list scroll position ([09a287b](https://github.com/ethan-heo/git-chronicle/commit/09a287b9cc77ceb0310db9dd5118a95fb2547655))
* dependency canvas file-not-found analysis ([d0da600](https://github.com/ethan-heo/git-chronicle/commit/d0da6000ecda5c9df20a0e48491d0a6946d65913))

### Documentation

* reflect F10 in README ([5a98834](https://github.com/ethan-heo/git-chronicle/commit/5a98834c1e29109d01972467e3da454ccac4eb30))
* add conventional commit guidelines ([c5ba64c](https://github.com/ethan-heo/git-chronicle/commit/c5ba64c7558da3ac900c3607a848c6fbf22b7de4))
* 프로젝트 개발 문서 추가 ([0338778](https://github.com/ethan-heo/git-chronicle/commit/03387789ac76f4979b229567281c082f5ae3d9a0))
