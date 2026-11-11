@file:OptIn(androidx.compose.material3.ExperimentalMaterial3Api::class)

package com.bindshq.stance

import androidx.compose.foundation.layout.Column
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.SemanticsProperties
import androidx.compose.ui.test.SemanticsMatcher
import androidx.compose.ui.test.assert
import androidx.compose.ui.test.assertHasClickAction
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.assertIsNotEnabled
import androidx.compose.ui.test.assertIsSelected
import androidx.compose.ui.test.junit4.createComposeRule
import androidx.compose.ui.test.onAllNodesWithText
import androidx.compose.ui.test.onNodeWithContentDescription
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import com.bindshq.stance.components.data.StanceAvatar
import com.bindshq.stance.components.data.StanceAvatarGroup
import com.bindshq.stance.components.data.StanceBadge
import com.bindshq.stance.components.data.StanceDataTable
import com.bindshq.stance.components.data.StanceDescriptionList
import com.bindshq.stance.components.data.StanceEmptyState
import com.bindshq.stance.components.data.StanceListItem
import com.bindshq.stance.components.data.StanceProgressIndicator
import com.bindshq.stance.components.data.StanceStatCard
import com.bindshq.stance.components.data.StanceTableColumn
import com.bindshq.stance.components.data.StanceTag
import com.bindshq.stance.components.data.StanceTimeline
import com.bindshq.stance.components.data.StanceTimelineEvent
import com.bindshq.stance.components.feedback.StanceAlertDialog
import com.bindshq.stance.components.feedback.StanceBanner
import com.bindshq.stance.components.feedback.StanceErrorState
import com.bindshq.stance.components.feedback.StanceInlineAlert
import com.bindshq.stance.components.feedback.StanceLoadingOverlay
import com.bindshq.stance.components.feedback.StanceSnackbarHost
import com.bindshq.stance.components.feedback.showStanceSnackbar
import com.bindshq.stance.components.navigation.StanceNavigationBar
import com.bindshq.stance.components.navigation.StanceNavigationItem
import com.bindshq.stance.components.navigation.StancePagerIndicator
import com.bindshq.stance.components.navigation.StanceStepper
import com.bindshq.stance.components.navigation.StanceTabs
import com.bindshq.stance.components.navigation.StanceTopAppBar
import com.bindshq.stance.foundation.StanceCard
import com.bindshq.stance.foundation.StanceTone
import com.bindshq.stance.icons.StanceIcons
import org.junit.Rule
import org.junit.runner.RunWith
import org.robolectric.RobolectricTestRunner
import org.robolectric.annotation.Config
import org.robolectric.annotation.GraphicsMode
import kotlin.test.Test
import kotlin.test.assertEquals

@RunWith(RobolectricTestRunner::class)
@GraphicsMode(GraphicsMode.Mode.NATIVE)
@Config(sdk = [35], qualifiers = "w600dp-h1400dp")
class ContentTest {
    @get:Rule
    val rule = createComposeRule()

    private val isHeading = SemanticsMatcher.keyIsDefined(SemanticsProperties.Heading)

    private val destinations = listOf(
        StanceNavigationItem("Templates", StanceIcons.FileText),
        StanceNavigationItem("Users", StanceIcons.Users, badge = "3"),
        StanceNavigationItem("Settings", StanceIcons.Settings),
    )

    @Test
    fun navigationBarSelectsDestinations() {
        var selected = 0
        rule.setStanceContent { StanceNavigationBar(destinations, selected, onSelect = { selected = it }) }
        rule.onNodeWithText("Templates").assertIsSelected()
        rule.onNodeWithText("Users").assertMinimumTouchTarget(rule).performClick()
        assertEquals(1, selected)
    }

    @Test
    fun topAppBarTitleIsAHeadingWithNavigateUp() {
        var up = 0
        rule.setStanceContent { StanceTopAppBar("Signature templates", onNavigateUp = { up++ }) }
        rule.onNodeWithText("Signature templates").assert(isHeading)
        rule.onNodeWithContentDescription("Navigate up").performClick()
        assertEquals(1, up)
    }

    @Test
    fun tabsReportSelection() {
        var selected = 0
        rule.setStanceContent { StanceTabs(listOf("Details", "Rollout"), selected, onSelect = { selected = it }) }
        rule.onNodeWithText("Details").assertIsSelected()
        rule.onNodeWithText("Rollout").performClick()
        assertEquals(1, selected)
    }

    @Test
    fun stepperAnnouncesPositionAndState() {
        rule.setStanceContent { StanceStepper(listOf("Template", "Recipients", "Review"), currentStep = 1) }
        rule.onNodeWithContentDescription("Step 1 of 3, Template")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "complete"))
        rule.onNodeWithContentDescription("Step 2 of 3, Recipients")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "current"))
        rule.onNodeWithContentDescription("Step 3 of 3, Review")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "upcoming"))
    }

    @Test
    fun pagerIndicatorIsOneAnnouncement() {
        rule.setStanceContent { StancePagerIndicator(pageCount = 4, currentPage = 1) }
        rule.onNodeWithContentDescription("Page 2 of 4").assertExists()
    }

    @Test
    fun badgeAndTagShowTheirText() {
        rule.setStanceContent {
            Column {
                StanceBadge("Live", tone = StanceTone.Success)
                StanceTag("Legal")
            }
        }
        rule.onNodeWithText("Live").assertIsDisplayed()
        rule.onNodeWithText("Legal").assertIsDisplayed()
    }

    @Test
    fun avatarIsAnnouncedByNameAndGroupSummarises() {
        rule.setStanceContent {
            Column {
                StanceAvatar("Amara Okafor")
                StanceAvatarGroup(listOf("Lukas Brenner", "Priya Nair", "Hana Sato", "Owen Price"), max = 2)
            }
        }
        rule.onNodeWithContentDescription("Amara Okafor").assertExists()
        rule.onNodeWithContentDescription("Lukas Brenner, Priya Nair and 2 more").assertExists()
    }

    @Test
    fun listItemIsOneClickableRow() {
        var clicks = 0
        rule.setStanceContent { StanceListItem("Sales team signature", supporting = "48 users", onClick = { clicks++ }) }
        rule.onNodeWithText("Sales team signature").assertHasClickAction().assertMinimumTouchTarget(rule).performClick()
        assertEquals(1, clicks)
    }

    @Test
    fun progressAnnouncesLabelAndPercentage() {
        rule.setStanceContent { StanceProgressIndicator(0.72f, label = "Rollout") }
        rule.onNodeWithContentDescription("Rollout").assert(SemanticsMatcher.expectValue(SemanticsProperties.StateDescription, "72%"))
    }

    @Test
    fun statCardSpeaksTheChangeInWords() {
        rule.setStanceContent {
            StanceStatCard("Signatures deployed", "1,284", change = "12%", changeDescription = "up 12% from last month", positive = true)
        }
        rule.onNodeWithContentDescription("up 12% from last month", useUnmergedTree = true).assertExists()
    }

    @Test
    fun emptyStateHasAHeadingAndAction() {
        rule.setStanceContent {
            StanceEmptyState("No templates yet", description = "Create your first signature template.") { Text("Create template") }
        }
        rule.onNodeWithText("No templates yet").assert(isHeading)
        rule.onNodeWithText("Create template").assertIsDisplayed()
    }

    @Test
    fun timelineAndDescriptionListRenderTheirContent() {
        rule.setStanceContent {
            Column {
                StanceTimeline(listOf(StanceTimelineEvent("Deployed", "10:42", "35 of 48 mailboxes"), StanceTimelineEvent("Created", "09:10")))
                StanceDescriptionList(listOf("Owner" to "Priya Nair", "Status" to "Live"))
            }
        }
        rule.onNodeWithText("Deployed").assertIsDisplayed()
        rule.onNodeWithText("Priya Nair").assertIsDisplayed()
    }

    @Test
    fun dataTableReadsRowsAsHeaderValuePairs() {
        data class User(val name: String, val team: String)
        var clicked = ""
        rule.setStanceContent {
            StanceDataTable(
                columns = listOf(StanceTableColumn<User>("Name") { it.name }, StanceTableColumn("Team") { it.team }),
                rows = listOf(User("Priya Nair", "Sales"), User("Hana Sato", "Finance")),
                caption = "Organisation users",
                onRowClick = { clicked = it.name },
            )
        }
        rule.onAllNodesWithText("Name")[0].assert(isHeading)
        rule.onNodeWithContentDescription("Name: Hana Sato, Team: Finance").assertHasClickAction().performClick()
        assertEquals("Hana Sato", clicked)
    }

    @Test
    fun clickableCardIsAButton() {
        var clicks = 0
        rule.setStanceContent { StanceCard(onClick = { clicks++ }) { Text("Open template") } }
        rule.onNodeWithText("Open template").performClick()
        assertEquals(1, clicks)
    }

    @Test
    fun alertsUseAssertiveRegionsOnlyForUrgentTones() {
        rule.setStanceContent {
            Column {
                StanceInlineAlert("Deployment finished.", tone = StanceTone.Success)
                StanceBanner("Your plan expires tomorrow.", tone = StanceTone.Warning, onDismiss = {})
            }
        }
        rule.onNodeWithText("Deployment finished.")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Polite))
        rule.onNodeWithText("Your plan expires tomorrow.")
            .assert(SemanticsMatcher.expectValue(SemanticsProperties.LiveRegion, LiveRegionMode.Assertive))
        rule.onNodeWithContentDescription("Dismiss").assertHasClickAction()
    }

    @Test
    fun alertDialogConfirmsAndCancels() {
        var confirmed = 0
        var dismissed = 0
        rule.setStanceContent {
            StanceAlertDialog(
                title = "Delete “Sales team” template?",
                message = "48 users will lose this signature.",
                confirmLabel = "Delete template",
                onConfirm = { confirmed++ },
                onDismissRequest = { dismissed++ },
                destructive = true,
            )
        }
        rule.onNodeWithText("Delete “Sales team” template?").assertIsDisplayed()
        rule.onNodeWithText("Delete template").performClick()
        rule.onNodeWithText("Cancel").performClick()
        assertEquals(1, confirmed)
        assertEquals(1, dismissed)
    }

    @Test
    fun alertDialogBlocksCancelWhileConfirming() {
        rule.setStanceContent {
            StanceAlertDialog("Deploy?", "This updates every mailbox.", "Deploy", onConfirm = {}, onDismissRequest = {}, confirmLoading = true)
        }
        rule.onNodeWithText("Cancel").assertIsNotEnabled()
    }

    @Test
    fun loadingOverlayAnnouncesItsMessage() {
        rule.setStanceContent { StanceLoadingOverlay(visible = true, message = "Deploying signature") { Text("Content") } }
        rule.onNodeWithContentDescription("Deploying signature").assert(SemanticsMatcher.keyIsDefined(SemanticsProperties.LiveRegion))
    }

    @Test
    fun errorStateOffersRetry() {
        var retries = 0
        rule.setStanceContent { StanceErrorState("Couldn’t load templates", description = "Check your connection.", onRetry = { retries++ }) }
        rule.onNodeWithText("Couldn’t load templates").assert(isHeading)
        rule.onNodeWithText("Try again").performClick()
        assertEquals(1, retries)
    }

    @Test
    fun snackbarShowsMessageAndAction() {
        rule.setStanceContent {
            val host = remember { SnackbarHostState() }
            LaunchedEffect(Unit) { host.showStanceSnackbar("Template saved", tone = StanceTone.Success, actionLabel = "Undo") }
            StanceSnackbarHost(host)
        }
        rule.onNodeWithText("Template saved").assertIsDisplayed()
        rule.onNodeWithText("Undo").assertHasClickAction()
    }
}
