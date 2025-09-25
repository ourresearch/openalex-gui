<template>
    <v-container class="mt-12 pt-12">
      <div class="text-h3">
        Transparency
      </div>
      <p class="mt-4">
        We think that organizations working for Open should be sure that they're being open themselves--with their code
        and data, and with the details of their operation. We're doing our best to live up to that, and this page
        is part of that effort. 
      </p>


      <div class="text-h4" id="papers">Research papers</div>
      <p>
        Our founders were academic researchers before moving to OpenAlex full-time, and we still publish
        research papers. Naturally, we publish only Open Access (OA) papers. We've occasionally published in toll-access
        journals, but in these cases we've either convinced the publishers to make our articles OA, or taken the
        <a href="https://en.wikipedia.org/wiki/Open_access#Green_OA">green OA road</a> by self-archiving the papers in a
        repository.
      </p>
    
      

      <div class="text-h4" id="posi">Principles for Open Scholarly Infrastructure (POSI)</div>
      <blockquote>
        <div>
          "First developed in a <a href="https://cameronneylon.net/blog/principles-for-open-scholarly-infrastructures/">2015
          blog post,</a> POSI offers a set of guidelines by which open scholarly infrastructure organisations and
          initiatives that support the research community can be run and sustained."
        </div>
        <div>
          <em>
            source: <a href="https://openscholarlyinfrastructure.org/about/">POSI website</a>
          </em>
        </div>
      </blockquote>
      <p>
        When we read the <a href="https://openscholarlyinfrastructure.org/">sixteen POSI principles</a>, we saw right away
        that they were solidly aligned with our core values of openness, progress, pragmatism, sustainability, and
        community. We're delighted to see momentum building around these kinds of values, and so we were thrilled to make
        OurResearch the fifth organization to commit to the POSI principles. We encourage other scholarly communications
        to do this as well.
      </p>
      <p>
        The full description of the principles and how we're honoring them is pretty long, so it's outside the scope of
        this page. You can read
        <a href="https://blog.ourresearch.org/posi/">Our POSI commitment here.</a>
      </p>
  
  
      <div class="text-h4" id="grants">Grants</div>
      <p>
        We publish all our grant proposals, both the successful ones and the ones that don't get funded. We also publish
        annual and final grant reports. These are all posted on
        <a href="https://www.ogrants.org">Open Grants</a> (search for  "Priem" to find them).
      </p>
  
  
      <div class="text-h4" id="salaries">Salaries</div>
      <p>Our board members are unpaid volunteers, except for Jason, who is on the board and is paid in
        his capacity as CEO. 
        Historical salaries for Jason and any other employees can be found in our tax records (see below).
      
        For hourly workers (including workers on cloud platforms like <a
          href="https://en.wikipedia.org/wiki/Amazon_Mechanical_Turk">Mechanical Turk</a>), we pay a minimum wage of
        $25/hour.
      </p>
  
  
      <div class="text-h4" id="taxes">Tax filings</div>
      <p>
        As a 501(c)3, we're exempt from corporate taxes. However, the law does require that we file a Form 990 to the IRS
        every year. This is great, because you can look up any 501(c)3 nonprofit's Form 990 and learn lots about their
        finances. You can find our annual Form 990 filings in many places online; <a
          href="https://projects.propublica.org/nonprofits/organizations/461599252">here are all our 990 filings</a> in
        Nonprofit Explorer by Pro Publica, for example. If you search for our taxes on other sites, you'll probably want
        to search under "Impactstory;" we go by OpenAlex now, but that's a <a
          href="https://en.wikipedia.org/wiki/Trade_name">"doing business as" (DBA)</a> name--we're still Impactstory to the government.
      </p>
  
  
  
  
  
  
  
      <div class="text-h4" id="corporate">Corporate documents</div>
      <p>
        We incorporated in North Carolina (USA) in 2012. Here are our <a href="/articles-of-incorporation.pdf">Articles of
        Incorporation</a> and our corporate <a href="/bylaws.pdf">by-laws.</a> Our IRS EIN (Employer Identification
        Number) is 46-1599252; here's our <a href="/IRS-w-9.pdf">IRS form W-9</a> which is pretty much just a fancy way of
        sharing that number. We've also got a <a href="/canada-business-registration.pdf">Canadian business number.</a>
      </p>
      <p>
        To become a US 501(c)3, we submitted this <a href="/IRS-1023.pdf">Form 1023</a> to the IRS, describing why we
        think we met the criteria for this type of nonprofit. The IRS thought about it for a while, and then issued us
        this <a href="/IRS-determination.pdf">determination letter,</a> granting us 501(c)3 status.
      </p>


  
      <div class="text-h4" id="code">Code</div>
      <p>
        The first lines of code we ever wrote together, at an all-night hackathon in 2011, were open-source. And as
        die-hard open-source advocates, that's still our approach. All our projects are open-source from day one, even
        before they're released.
      </p>
      <p>
  
  
        We license code under the <a
          href="https://en.wikipedia.org/wiki/MIT_License">MIT License.</a> The MIT license is a "permissive license,"
        meaning it imposes very few restrictions on downstream use. We're happy that our code has often been reused and
        repurposed, by both nonprofit and for-profit organizations. You can find the code for all our projects on <a
          href="htthttps://github.com/ourresearch">GitHub.</a>
      </p>
      <p>
        If OurResearch or GitHub were to become sufficiently evil, this GitHub-hosted code could be removed or
        re-licensed. So it's important that our code is also held in the
        <a href="https://archive.softwareheritage.org/browse/search/?q=ourresearch&with_visit=true&with_content=true">Software
          Heritage archive,</a> maintained outside our control a by third-party nonprofit dedicated to the long-term
        preservation of its openness.
      </p>
  
      <p>
        Sometimes software source code is encumbered by patents. Ours isn't, and it never will be. This is our <a href="http://www.iphandbook.org/handbook/ch07/p06/">patent non-assertion covenant:</a> OurResearch confirms it does not currently control any patents, and irrevocably promises not to apply for or attempt to obtain patents in the future.
      </p>
  
    </v-container>
  </template>
  
  <script>
  export default {
    name: "Transparency",
    metaInfo() {
      return {
        title: "Transparency"
      }
    },
  }
  </script>
  
  <style scoped lang="scss">
  .text-h4 {
    margin-top: 50px;
    margin-bottom: 10px;
  }
  
  blockquote {
    border-left: 5px solid #ddd;
    padding-left: 10px;
    margin: 20px 0;
  }
  p {
    margin-bottom: 20px;
  }
  
  
  </style>